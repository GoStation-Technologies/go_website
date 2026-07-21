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

export const adminOverviewStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase;
    const [stations, franchise, acq, contact, chats24] = await Promise.all([
      s.from("stations").select("id", { count: "exact", head: true }),
      s.from("franchise_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
      s.from("acquisition_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      s.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      s.from("chatbot_messages").select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString()),
    ]);
    return {
      stations: stations.count ?? 0,
      pendingFranchise: franchise.count ?? 0,
      pendingAcquisitions: acq.count ?? 0,
      unreadContacts: contact.count ?? 0,
      chats24h: chats24.count ?? 0,
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
    const { data: rows, error } = await context.supabase
      .from("chatbot_messages")
      .select("session_id, role, content, created_at")
      .order("created_at", { ascending: false })
      .limit(WINDOW);
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

