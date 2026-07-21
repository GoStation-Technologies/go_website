import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MetricsInput = z.object({
  windowHours: z.number().int().min(1).max(24 * 30).default(24),
  limitRecent: z.number().int().min(1).max(200).default(50),
});

/**
 * Aggregated abuse metrics for the admin dashboard: totals + breakdowns
 * by reason, by key, and the most recent events. Requires super_admin.
 * Reads from `abuse_events` via service_role (RLS locks that table down).
 */
export const adminAbuseMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => MetricsInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.windowHours * 3600_000).toISOString();

    const [{ count: total }, { data: rows }, { data: recent }] = await Promise.all([
      supabaseAdmin
        .from("abuse_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
      supabaseAdmin
        .from("abuse_events")
        .select("reason, key, session_id, ip_hash")
        .gte("created_at", since)
        .limit(5000),
      supabaseAdmin
        .from("abuse_events")
        .select("id, created_at, reason, key, session_id, ip_hash, current_count, lang, metadata")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(data.limitRecent),
    ]);

    const byReason: Record<string, number> = {};
    const byKey: Record<string, number> = {};
    const sessionSet = new Set<string>();
    const ipSet = new Set<string>();
    for (const r of rows ?? []) {
      const reason = (r.reason as string) ?? "unknown";
      byReason[reason] = (byReason[reason] ?? 0) + 1;
      const key = (r.key as string | null) ?? "(none)";
      byKey[key] = (byKey[key] ?? 0) + 1;
      if (r.session_id) sessionSet.add(r.session_id as string);
      if (r.ip_hash) ipSet.add(r.ip_hash as string);
    }
    const topKeys = Object.entries(byKey)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => ({ key, count }));

    return {
      windowHours: data.windowHours,
      total: total ?? 0,
      byReason,
      topKeys,
      uniqueSessions: sessionSet.size,
      uniqueIps: ipSet.size,
      recent: recent ?? [],
    };
  });
