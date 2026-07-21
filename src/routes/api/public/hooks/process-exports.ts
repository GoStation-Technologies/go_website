import { createFileRoute } from "@tanstack/react-router";

const MAX_ROWS = 200_000;
const PAGE_SIZE = 5_000;

const csvEscape = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Public hook (apikey-protected) that processes queued export_jobs rows.
 * Called by pg_cron every minute and can also be poked ad-hoc.
 */
export const Route = createFileRoute("/api/public/hooks/process-exports")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !anon || apikey !== anon) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Atomically lease up to 3 pending jobs.
        const { data: leased, error: leaseErr } = await supabaseAdmin.rpc("export_jobs_lease", {
          _limit: 3,
        });
        if (leaseErr) {
          return Response.json({ error: leaseErr.message }, { status: 500 });
        }

        const jobs = (leased ?? []) as Array<{
          id: string;
          user_id: string;
          kind: string;
          filters: Record<string, unknown>;
        }>;

        const results: Array<{ id: string; status: string; rowCount?: number; error?: string }> = [];

        for (const job of jobs) {
          try {
            if (job.kind !== "abuse_events") {
              throw new Error(`Unsupported kind: ${job.kind}`);
            }
            const windowHours = Math.min(24 * 30, Math.max(1, Number(job.filters.windowHours ?? 24)));
            const reason = typeof job.filters.reason === "string" ? job.filters.reason : undefined;
            const since = new Date(Date.now() - windowHours * 3_600_000).toISOString();

            const headers = [
              "id",
              "created_at",
              "reason",
              "key",
              "session_id",
              "ip_hash",
              "current_count",
              "lang",
              "metadata",
            ];
            const chunks: string[] = [headers.join(",")];
            let fetched = 0;
            let from = 0;

            while (fetched < MAX_ROWS) {
              const to = from + PAGE_SIZE - 1;
              let q = supabaseAdmin
                .from("abuse_events")
                .select(headers.join(","))
                .gte("created_at", since)
                .order("created_at", { ascending: false })
                .range(from, to);
              if (reason) q = q.eq("reason", reason);

              const { data: rows, error } = await q;
              if (error) throw new Error(error.message);
              if (!rows || rows.length === 0) break;

              for (const r of rows as unknown as Array<Record<string, unknown>>) {
                chunks.push(
                  headers.map((h) => csvEscape(r[h])).join(","),
                );
              }
              fetched += rows.length;
              if (rows.length < PAGE_SIZE) break;
              from += PAGE_SIZE;
            }

            const csv = `\ufeff${chunks.join("\n")}`;
            const path = `${job.user_id}/${job.id}.csv`;
            const { error: upErr } = await supabaseAdmin.storage
              .from("exports")
              .upload(path, new Blob([csv], { type: "text/csv;charset=utf-8" }), {
                contentType: "text/csv;charset=utf-8",
                upsert: true,
              });
            if (upErr) throw new Error(upErr.message);

            const { error: updErr } = await supabaseAdmin
              .from("export_jobs")
              .update({
                status: "ready",
                row_count: fetched,
                storage_path: path,
                finished_at: new Date().toISOString(),
                error: null,
              })
              .eq("id", job.id);
            if (updErr) throw new Error(updErr.message);

            results.push({ id: job.id, status: "ready", rowCount: fetched });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            await supabaseAdmin
              .from("export_jobs")
              .update({
                status: "failed",
                error: message,
                finished_at: new Date().toISOString(),
              })
              .eq("id", job.id);
            results.push({ id: job.id, status: "failed", error: message });
          }
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});
