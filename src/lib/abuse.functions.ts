import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MetricsInput = z.object({
  windowHours: z.number().int().min(1).max(24 * 30).default(24),
  limitRecent: z.number().int().min(1).max(200).default(50),
  reason: z.string().min(1).max(64).optional(),
});

/**
 * Aggregated abuse metrics for the admin dashboard: totals, breakdowns
 * by reason/key, time-series buckets, and the most recent events.
 * Requires super_admin. Reads from `abuse_events` via service_role.
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
    const sinceMs = Date.now() - data.windowHours * 3600_000;
    const since = new Date(sinceMs).toISOString();

    // Bucket size: hourly for <=48h windows, otherwise daily.
    const bucketMs = data.windowHours <= 48 ? 3600_000 : 86_400_000;
    const bucketCount = Math.max(1, Math.ceil((data.windowHours * 3600_000) / bucketMs));

    let rowsQ = supabaseAdmin
      .from("abuse_events")
      .select("reason, key, session_id, ip_hash, created_at")
      .gte("created_at", since)
      .limit(10000);
    if (data.reason) rowsQ = rowsQ.eq("reason", data.reason);

    let recentQ = supabaseAdmin
      .from("abuse_events")
      .select("id, created_at, reason, key, session_id, ip_hash, current_count, lang, metadata")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(data.limitRecent);
    if (data.reason) recentQ = recentQ.eq("reason", data.reason);

    const [{ data: rows }, { data: recent }] = await Promise.all([rowsQ, recentQ]);

    const byReason: Record<string, number> = {};
    const byKey: Record<string, number> = {};
    const sessionSet = new Set<string>();
    const ipSet = new Set<string>();

    // Time-series: bucket -> reason -> count
    const seriesMap = new Map<number, Record<string, number>>();
    const bucketStart = (t: number) => Math.floor((t - sinceMs) / bucketMs);
    for (let i = 0; i < bucketCount; i++) seriesMap.set(i, {});

    for (const r of rows ?? []) {
      const reason = (r.reason as string) ?? "unknown";
      byReason[reason] = (byReason[reason] ?? 0) + 1;
      const key = (r.key as string | null) ?? "(none)";
      byKey[key] = (byKey[key] ?? 0) + 1;
      if (r.session_id) sessionSet.add(r.session_id as string);
      if (r.ip_hash) ipSet.add(r.ip_hash as string);
      const ts = new Date(r.created_at as string).getTime();
      const idx = Math.min(bucketCount - 1, Math.max(0, bucketStart(ts)));
      const bucket = seriesMap.get(idx)!;
      bucket[reason] = (bucket[reason] ?? 0) + 1;
    }

    const series = Array.from(seriesMap.entries()).map(([idx, counts]) => ({
      t: new Date(sinceMs + idx * bucketMs).toISOString(),
      ...counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    }));

    const topKeys = Object.entries(byKey)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => ({ key, count }));

    const reasonBreakdown = Object.entries(byReason)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason, count }));

    return {
      windowHours: data.windowHours,
      bucketMs,
      reason: data.reason ?? null,
      total: (rows ?? []).length,
      byReason,
      reasonBreakdown,
      topKeys,
      series,
      uniqueSessions: sessionSet.size,
      uniqueIps: ipSet.size,
      recent: recent ?? [],
    };
  });
