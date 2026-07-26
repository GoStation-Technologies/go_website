import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeAudit, type AuditEntity } from "./audit";


/**
 * Returns which staff roles the current user has (if any).
 * Any role = staff = can access /admin. Section access is per-role in each server fn.
 */
export const getMyStaffRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) return { roles: [] as string[] };
    return { roles: (data ?? []).map((r) => r.role as string) };
  });

const OverviewInput = z.object({
  days: z.number().int().min(1).max(90).default(14),
}).optional();

export const adminOverviewStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => OverviewInput.parse(data))
  .handler(async ({ data, context }) => {
    const s = context.supabase;
    const days = data?.days ?? 14;
    const sinceRange = new Date(Date.now() - days * 24 * 3600_000).toISOString();
    const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();
    const [
      stations, franchise, acq, contact, chats24,
      news, jobs, abuse24, exportsRunning,
      chatsSeries, franchiseSeries, abuseSeries,
    ] = await Promise.all([
      s.from("stations").select("id", { count: "exact", head: true }),
      s.from("franchise_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
      s.from("acquisition_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      s.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      s.from("chatbot_messages").select("id", { count: "exact", head: true }).gte("created_at", since24h),
      s.from("news_articles").select("id", { count: "exact", head: true }),
      s.from("job_openings").select("id", { count: "exact", head: true }).eq("is_active", true),
      s.from("abuse_events").select("id", { count: "exact", head: true }).gte("created_at", since24h),
      s.from("export_jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "processing"]),
      s.from("chatbot_messages").select("created_at").gte("created_at", sinceRange),
      s.from("franchise_applications").select("created_at").gte("created_at", sinceRange),
      s.from("abuse_events").select("created_at").gte("created_at", sinceRange),
    ]);

    const bucketize = (rows: { created_at: string }[] | null | undefined) => {
      const map = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 3600_000).toISOString().slice(0, 10);
        map.set(d, 0);
      }
      (rows ?? []).forEach((r) => {
        const d = (r.created_at ?? "").slice(0, 10);
        if (map.has(d)) map.set(d, (map.get(d) ?? 0) + 1);
      });
      return Array.from(map, ([date, count]) => ({ date, count }));
    };

    return {
      days,
      stations: stations.count ?? 0,
      pendingFranchise: franchise.count ?? 0,
      pendingAcquisitions: acq.count ?? 0,
      unreadContacts: contact.count ?? 0,
      chats24h: chats24.count ?? 0,
      news: news.count ?? 0,
      activeJobs: jobs.count ?? 0,
      abuse24h: abuse24.count ?? 0,
      exportsRunning: exportsRunning.count ?? 0,
      chatsSeries: bucketize(chatsSeries.data as { created_at: string }[] | null),
      franchiseSeries: bucketize(franchiseSeries.data as { created_at: string }[] | null),
      abuseSeries: bucketize(abuseSeries.data as { created_at: string }[] | null),
    };
  });

const ListInput = z.object({
  kind: z.enum(["franchise", "acquisitions", "contact"]),
  status: z.string().optional(),
  days: z.number().int().min(1).max(365).optional(),
  limit: z.number().int().min(1).max(200).default(25),
  page: z.number().int().min(1).default(1),
  sort: z.enum(["newest", "oldest", "relevance"]).default("newest"),
});

// "Relevance" surfaces actionable rows first (new → reviewing → closed),
// then most recent within the same bucket.
const RELEVANCE_RANK: Record<string, number> = { new: 0, reviewing: 1, closed: 2 };

export const adminListSubmissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ListInput.parse(raw))
  .handler(async ({ data, context }) => {
    const table =
      data.kind === "franchise"
        ? "franchise_applications"
        : data.kind === "acquisitions"
          ? "acquisition_requests"
          : "contact_messages";

    const from = (data.page - 1) * data.limit;
    const to = from + data.limit - 1;

    let q = context.supabase.from(table).select("*", { count: "exact" });
    if (data.status) q = q.eq("status", data.status);
    if (data.days) {
      const since = new Date(Date.now() - data.days * 24 * 3600_000).toISOString();
      q = q.gte("created_at", since);
    }

    if (data.sort === "relevance") {
      // Postgres has no cross-DB rank column, so sort by status then created_at.
      // Sort ascending on status text alone would put "closed" before "new";
      // instead we order by (status, created_at desc) client-side after fetch
      // when the ranks matter. Do it in-DB for the common case using a CASE
      // isn't supported via PostgREST — do a two-key order that's close enough
      // (status asc happens to yield closed/new/reviewing) then re-sort in JS.
      q = q.order("created_at", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: data.sort === "oldest" });
    }
    q = q.range(from, to);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    let ordered = rows ?? [];
    if (data.sort === "relevance") {
      ordered = [...ordered].sort((a, b) => {
        const ra = RELEVANCE_RANK[String(a.status ?? "new")] ?? 99;
        const rb = RELEVANCE_RANK[String(b.status ?? "new")] ?? 99;
        if (ra !== rb) return ra - rb;
        return String(b.created_at).localeCompare(String(a.created_at));
      });
    }
    const total = count ?? 0;
    return {
      rows: ordered,
      total,
      page: data.page,
      limit: data.limit,
      pageCount: Math.max(1, Math.ceil(total / data.limit)),
    };
  });



const SUBMISSION_STATUSES = ["new", "reviewing", "approved", "closed"] as const;
type SubmissionKind = "franchise" | "acquisitions" | "contact";
type SubmissionTable = "franchise_applications" | "acquisition_requests" | "contact_messages";
const TABLE_FOR = {
  franchise: "franchise_applications",
  acquisitions: "acquisition_requests",
  contact: "contact_messages",
} as const satisfies Record<SubmissionKind, SubmissionTable>;

const STAFF_ROLES = ["super_admin", "bd", "hr", "media", "ir", "ops", "support"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const StatusInput = z.object({
  kind: z.enum(["franchise", "acquisitions", "contact"]),
  id: z.string().uuid(),
  status: z.enum(SUBMISSION_STATUSES),
});

export const adminUpdateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StatusInput.parse(raw))
  .handler(async ({ data, context }) => {
    const table = TABLE_FOR[data.kind];
    // Cast: `.from(dynamicUnion)` collapses to `never` in the generated types.
    const { error } = await (context.supabase.from(table) as any)
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(
      context.supabase,
      { id: context.userId, email: (context.claims as { email?: string } | undefined)?.email ?? null },
      {
        action: "update_status",
        entity: table as AuditEntity,
        entity_ids: [data.id],
        diff: { status: data.status },
      },
    );
    return { ok: true };
  });


// Bulk apply status and/or assignee to many rows of the same kind at once.
// `assigned_to: null` explicitly unassigns; omitting the key leaves it unchanged.
const BulkInput = z.object({
  kind: z.enum(["franchise", "acquisitions", "contact"]),
  ids: z.array(z.string().uuid()).min(1).max(200),
  patch: z
    .object({
      status: z.enum(SUBMISSION_STATUSES).optional(),
      assigned_to: z.string().uuid().nullable().optional(),
    })
    .refine((p) => p.status !== undefined || p.assigned_to !== undefined, {
      message: "patch must set status or assigned_to",
    }),
});

export const adminBulkUpdateSubmissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => BulkInput.parse(raw))
  .handler(async ({ data, context }) => {
    const table = TABLE_FOR[data.kind];
    // Snapshot current status + assignee BEFORE the update so the caller
    // can offer an undo. RLS filters this select the same way as the update.
    const { data: beforeRows, error: beforeErr } = await (context.supabase.from(table) as any)
      .select("id, status, assigned_to")
      .in("id", data.ids);
    if (beforeErr) throw new Error(beforeErr.message);
    const before = ((beforeRows ?? []) as Array<{ id: string; status: string; assigned_to: string | null }>);

    const patch: Record<string, unknown> = {};
    if (data.patch.status !== undefined) patch.status = data.patch.status;
    if (data.patch.assigned_to !== undefined) patch.assigned_to = data.patch.assigned_to;
    const { error, count } = await (context.supabase.from(table) as any)
      .update(patch, { count: "exact" })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    await writeAudit(
      context.supabase,
      { id: context.userId, email: (context.claims as { email?: string } | undefined)?.email ?? null },
      {
        action: "bulk_update",
        entity: table as AuditEntity,
        entity_ids: data.ids,
        diff: { patch, updated: count ?? data.ids.length },
        meta: { before },
      },
    );
    return { ok: true, updated: count ?? data.ids.length, before };
  });

// Restore per-row status + assignee snapshots captured before a bulk update.
// One UPDATE per row keeps it simple; ids are capped at 200 upstream.
const RestoreInput = z.object({
  kind: z.enum(["franchise", "acquisitions", "contact"]),
  rows: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: z.enum(SUBMISSION_STATUSES),
        assigned_to: z.string().uuid().nullable(),
      }),
    )
    .min(1)
    .max(200),
});

export const adminBulkRestoreSubmissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RestoreInput.parse(raw))
  .handler(async ({ data, context }) => {
    const table = TABLE_FOR[data.kind];
    let restored = 0;
    for (const row of data.rows) {
      const { error } = await (context.supabase.from(table) as any)
        .update({ status: row.status, assigned_to: row.assigned_to })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
      restored += 1;
    }
    await writeAudit(
      context.supabase,
      { id: context.userId, email: (context.claims as { email?: string } | undefined)?.email ?? null },
      {
        action: "bulk_restore",
        entity: table as AuditEntity,
        entity_ids: data.rows.map((r) => r.id),
        diff: { restored },
        meta: { rows: data.rows },
      },
    );
    return { ok: true, restored };
  });



// Staff picker for the assign action. Two queries — user_roles has no FK to
// public.profiles so PostgREST cannot embed them. Uses the admin client only
// after verifying the caller is staff under RLS.
export const adminListStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: mine, error: meErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (meErr) throw new Error(meErr.message);
    const isStaff = (mine ?? []).some((r) => (STAFF_ROLES as readonly string[]).includes(r.role));
    if (!isStaff) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRows, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", STAFF_ROLES as unknown as StaffRole[]);
    if (rolesErr) throw new Error(rolesErr.message);
    const rows = roleRows ?? [];
    if (!rows.length) return { staff: [] as Array<{ id: string; name: string; roles: string[] }> };

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    if (pErr) throw new Error(pErr.message);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || "Unnamed"] as const));

    const byId = new Map<string, { id: string; name: string; roles: string[] }>();
    for (const r of rows) {
      const existing = byId.get(r.user_id) ?? { id: r.user_id, name: nameById.get(r.user_id) ?? "Unnamed", roles: [] };
      if (!existing.roles.includes(r.role)) existing.roles.push(r.role);
      byId.set(r.user_id, existing);
    }
    return { staff: Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)) };
  });



export { ChatsInput, paginateSessions, validateChatsInput, type AdminListChatsInput } from "./admin.pagination";
import { validateChatsInput } from "./admin.pagination";

export const adminListChats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => validateChatsInput(raw))
  .handler(async ({ data, context }) => {
    // Fetch a bounded window of recent messages, group by session in memory,
    // then sort + paginate. Enough for the admin logs view; move to an RPC if
    // the window ever needs to grow past this bound.
    const WINDOW = 2000;
    let query = context.supabase
      .from("chatbot_messages")
      .select("session_id, role, content, created_at")
      .order("created_at", { ascending: false })
      .limit(WINDOW);
    if (data.sinceHours) {
      const cutoff = new Date(Date.now() - data.sinceHours * 3600_000).toISOString();
      query = query.gte("created_at", cutoff);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const groups = new Map<string, Array<{ role: string; content: string; created_at: string }>>();
    for (const m of rows ?? []) {
      const arr = groups.get(m.session_id) ?? [];
      arr.push({ role: m.role, content: m.content, created_at: m.created_at });
      groups.set(m.session_id, arr);
    }
    const all = Array.from(groups.entries()).map(([sessionId, msgs]) => ({
      sessionId,
      messages: msgs.slice().reverse(), // chronological (oldest → newest)
      lastAt: msgs[0]?.created_at ?? null,
      firstAt: msgs[msgs.length - 1]?.created_at ?? null,
      messageCount: msgs.length,
    }));

    const q = data.q.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (s) =>
            s.sessionId.toLowerCase().includes(q) ||
            s.messages.some((m) => m.content.toLowerCase().includes(q)),
        )
      : all;

    const cmp = (a: typeof all[number], b: typeof all[number]) => {
      if (data.sort === "oldest") return (a.firstAt ?? "").localeCompare(b.firstAt ?? "");
      if (data.sort === "messages") {
        if (b.messageCount !== a.messageCount) return b.messageCount - a.messageCount;
        return (b.lastAt ?? "").localeCompare(a.lastAt ?? "");
      }
      return (b.lastAt ?? "").localeCompare(a.lastAt ?? "");
    };
    filtered.sort(cmp);

    const total = filtered.length;
    const pageSize = data.pageSize;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, data.page), pageCount);
    const start = (page - 1) * pageSize;
    const sessions = filtered.slice(start, start + pageSize);

    return { sessions, total, page, pageSize, pageCount, sort: data.sort, q };
  });

// ─── Stations CRUD (ops / super_admin via RLS) ──────────────────────────
const StationInput = z.object({
  id: z.string().uuid().optional(),
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  city_ar: z.string().min(1),
  city_en: z.string().min(1),
  district_ar: z.string().optional().nullable(),
  district_en: z.string().optional().nullable(),
  address_ar: z.string().optional().nullable(),
  address_en: z.string().optional().nullable(),
  lat: z.number(),
  lng: z.number(),
  is_24h: z.boolean().default(false),
  is_active: z.boolean().default(true),
  fuel_types: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  photo_url: z.string().optional().nullable(),
});

export const adminListStations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stations").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

const auditActor = (context: { userId: string; claims: unknown }) => ({
  id: context.userId,
  email: (context.claims as { email?: string } | undefined)?.email ?? null,
});

export const adminUpsertStation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StationInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stations").upsert(data);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, auditActor(context), {
      action: "upsert",
      entity: "stations",
      entity_ids: data.id ? [data.id] : null,
      diff: data,
    });
    return { ok: true };
  });

export const adminDeleteStation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, auditActor(context), {
      action: "delete",
      entity: "stations",
      entity_ids: [data.id],
    });
    return { ok: true };
  });

// ─── News CRUD (media / super_admin) ────────────────────────────────────
const NewsInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  kind: z.enum(["news", "event", "press"]).default("news"),
  title_ar: z.string().min(1),
  title_en: z.string().min(1),
  excerpt_ar: z.string().optional().nullable(),
  excerpt_en: z.string().optional().nullable(),
  body_ar: z.string().optional().nullable(),
  body_en: z.string().optional().nullable(),
  cover_url: z.string().optional().nullable(),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  published_at: z.string().optional().nullable(),
});

export const adminListNews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("news_articles").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminUpsertNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => NewsInput.parse(raw))
  .handler(async ({ data, context }) => {
    const payload = { ...data, published_at: data.is_published && !data.published_at ? new Date().toISOString() : data.published_at };
    const { error } = await context.supabase.from("news_articles").upsert(payload);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, auditActor(context), {
      action: "upsert",
      entity: "news_articles",
      entity_ids: data.id ? [data.id] : null,
      diff: payload,
    });
    return { ok: true };
  });

export const adminDeleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("news_articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, auditActor(context), {
      action: "delete",
      entity: "news_articles",
      entity_ids: [data.id],
    });
    return { ok: true };
  });

// ─── Careers / Job Openings CRUD (hr / super_admin) ─────────────────────
const JobInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title_ar: z.string().min(1),
  title_en: z.string().min(1),
  department_en: z.string().min(1),
  department_ar: z.string().min(1),
  city_en: z.string().min(1),
  city_ar: z.string().min(1),
  employment_type: z.string().min(1),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});


export const adminListJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("job_openings").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminUpsertJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => JobInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_openings").upsert({
      ...data,
      department: data.department_en,
      city: data.city_en,
    });

    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, auditActor(context), {
      action: "upsert",
      entity: "job_openings",
      entity_ids: data.id ? [data.id] : null,
      diff: data,
    });
    return { ok: true };
  });

export const adminDeleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_openings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, auditActor(context), {
      action: "delete",
      entity: "job_openings",
      entity_ids: [data.id],
    });
    return { ok: true };
  });




// ─── Audit log (read) ───────────────────────────────────────────────────
const AuditListInput = z.object({
  entity: z.string().min(1).max(64).optional(),
  action: z.string().min(1).max(32).optional(),
  actorId: z.string().uuid().optional(),
  sinceHours: z.coerce.number().int().min(1).max(24 * 365).default(24 * 30),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const adminListAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => AuditListInput.parse(raw))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.sinceHours * 3600_000).toISOString();
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = (context.supabase.from("admin_audit_log") as any)
      .select("id, created_at, actor_id, actor_email, action, entity, entity_ids, diff, meta", { count: "exact" })
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.action) q = q.eq("action", data.action);
    if (data.actorId) q = q.eq("actor_id", data.actorId);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    type AuditRow = {
      id: string;
      created_at: string;
      actor_id: string | null;
      actor_email: string | null;
      action: string;
      entity: string;
      entity_ids: string[] | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      diff: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meta: any;
    };
    return { rows: (rows ?? []) as AuditRow[], total: (count ?? 0) as number, page: data.page, pageSize: data.pageSize };
  });

const AuditExportInput = z.object({
  entity: z.string().min(1).max(64).optional(),
  action: z.string().min(1).max(32).optional(),
  actorId: z.string().uuid().optional(),
  sinceHours: z.coerce.number().int().min(1).max(24 * 365).default(24 * 30),
});

const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export of the audit log for the current filters (up to 10k rows). */
export const adminExportAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => AuditExportInput.parse(raw))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.sinceHours * 3600_000).toISOString();
    let q = (context.supabase.from("admin_audit_log") as any)
      .select("id, created_at, actor_id, actor_email, action, entity, entity_ids, diff, meta")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.action) q = q.eq("action", data.action);
    if (data.actorId) q = q.eq("actor_id", data.actorId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const headers = ["id", "created_at", "actor_id", "actor_email", "action", "entity", "entity_ids", "diff", "meta"];
    const lines: string[] = [headers.join(",")];
    for (const r of (rows ?? []) as Array<Record<string, unknown>>) {
      lines.push(headers.map((h) => csvEscape(r[h])).join(","));
    }
    return { csv: lines.join("\n"), count: (rows ?? []).length as number };
  });
