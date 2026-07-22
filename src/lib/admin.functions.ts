import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  limit: z.number().int().min(1).max(200).default(50),
});

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

    let q = context.supabase.from(table).select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

const StatusInput = z.object({
  kind: z.enum(["franchise", "acquisitions", "contact"]),
  id: z.string().uuid(),
  status: z.enum(["new", "reviewing", "closed"]),
});

export const adminUpdateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StatusInput.parse(raw))
  .handler(async ({ data, context }) => {
    const table =
      data.kind === "franchise"
        ? "franchise_applications"
        : data.kind === "acquisitions"
          ? "acquisition_requests"
          : "contact_messages";
    const { error } = await context.supabase.from(table).update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
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

export const adminUpsertStation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StationInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stations").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteStation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
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
    return { ok: true };
  });

export const adminDeleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("news_articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Careers / Job Openings CRUD (hr / super_admin) ─────────────────────
const JobInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title_ar: z.string().min(1),
  title_en: z.string().min(1),
  department: z.string().min(1),
  city: z.string().min(1),
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
    const { error } = await context.supabase.from("job_openings").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_openings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


