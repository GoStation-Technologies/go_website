import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import {
  adminAbuseMetrics,
  adminAbuseExportSubmit,
  adminExportJobsList,
  adminExportJobDownload,
} from "@/lib/abuse.functions";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
import { fmtNumber, fmtDateTime } from "@/lib/format";
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

const searchSchema = z.object({
  windowHours: z.coerce.number().int().min(1).max(24 * 90).catch(24).default(24),
  reason: z.string().min(1).max(64).optional(),
});

export const Route = createFileRoute("/manage-portal-9f4c2ab7/abuse")({
  validateSearch: zodValidator(searchSchema),
  component: AbuseDashboard,
});

const WINDOWS = [
  { v: 1, k: "h1" },
  { v: 6, k: "h6" },
  { v: 24, k: "h24" },
  { v: 24 * 7, k: "d7" },
  { v: 24 * 30, k: "d30" },
];

const REASONS = [
  "duplicate",
  "too_fast",
  "session_minute",
  "session_hour",
  "session_day",
  "ip_minute",
  "ip_hour",
  "blocked_content",
  "too_many_urls",
];

function AbuseDashboard() {
  const { t } = useTranslation();
  const { windowHours, reason } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ["admin", "export-jobs"],
    queryFn: () => adminExportJobsList(),
    refetchInterval: (q) => {
      const jobs = (q.state.data as { jobs: Array<{ status: string }> } | undefined)?.jobs ?? [];
      return jobs.some((j) => j.status === "queued" || j.status === "processing") ? 3000 : false;
    },
  });

  const downloadInline = (rows: Array<Record<string, unknown>>) => {
    const headers = ["id", "created_at", "reason", "key", "session_id", "ip_hash", "current_count", "lang", "metadata"];
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
    ].join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `abuse-events_${windowHours}h${reason ? `_${reason}` : ""}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      const res = await adminAbuseExportSubmit({ data: { windowHours, reason } });
      if (res.mode === "inline") {
        downloadInline(res.rows as Array<Record<string, unknown>>);
        setExportMsg(`Downloaded ${fmtNumber(res.total)} rows.`);
      } else {
        setExportMsg(
          `Large export queued (${fmtNumber(res.total)} rows). It will appear in Export jobs below when ready.`,
        );
        jobsQuery.refetch();
      }
    } catch (err) {
      setExportMsg(`Export failed: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadJob = async (jobId: string) => {
    try {
      const { url } = await adminExportJobDownload({ data: { jobId } });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setExportMsg(`Download failed: ${(err as Error).message}`);
    }
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "abuse", windowHours, reason ?? null],
    queryFn: () =>
      adminAbuseMetrics({ data: { windowHours, limitRecent: 50, reason } }),
  });

  const seriesReasons = useMemo(() => {
    if (!data) return [] as string[];
    const acc = new Set<string>();
    for (const b of data.series) {
      for (const k of Object.keys(b)) {
        if (k !== "t" && k !== "total") acc.add(k);
      }
    }
    return Array.from(acc);
  }, [data]);

  const timeFmt = (iso: string) => {
    const d = new Date(iso);
    return data && data.bucketMs >= 86_400_000
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const palette = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#ea580c"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.abuse.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(windowHours)}
            onValueChange={(v) =>
              navigate({ search: (p: z.infer<typeof searchSchema>) => ({ ...p, windowHours: Number(v) }) })
            }
          >
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w.v} value={String(w.v)}>{t(`admin.abuse.ranges.${w.k}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={reason ?? "all"}
            onValueChange={(v) =>
              navigate({ search: (p: z.infer<typeof searchSchema>) => ({ ...p, reason: v === "all" ? undefined : v }) })
            }
          >
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.abuse.allReasons")}</SelectItem>
              {REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => refetch()}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent/10"
          >
            {isFetching ? t("admin.abuse.refreshing") : t("admin.abuse.refresh")}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent/10 disabled:opacity-50"
          >
            {exporting ? t("admin.abuse.exporting") : t("admin.abuse.exportCsv")}
          </button>
        </div>
      </div>

      {exportMsg && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">{exportMsg}</div>
      )}

      <ExportJobsPanel
        jobs={(jobsQuery.data?.jobs ?? []) as unknown as ExportJob[]}
        onDownload={handleDownloadJob}
        onRefresh={() => jobsQuery.refetch()}
        isFetching={jobsQuery.isFetching}
      />

      {isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load metrics: {(error as Error).message}
        </div>
      )}

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("admin.abuse.totalEvents")} value={data.total} />
            <Stat label={t("admin.abuse.uniqueSessions")} value={data.uniqueSessions} />
            <Stat label={t("admin.abuse.uniqueIps")} value={data.uniqueIps} />
            <Stat label={t("admin.abuse.topReason")} value={data.reasonBreakdown[0]?.reason ?? "—"} />
          </div>

          <section className="rounded-xl border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t("admin.abuse.overTime")}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="t" tickFormatter={timeFmt} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => fmtDateTime(v as string)} />
                  <Legend />
                  {reason ? (
                    <Line type="monotone" dataKey={reason} stroke={palette[0]} strokeWidth={2} dot={false} />
                  ) : (
                    seriesReasons.map((r, i) => (
                      <Line
                        key={r}
                        type="monotone"
                        dataKey={r}
                        stroke={palette[i % palette.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border bg-background p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t("admin.abuse.byReason")}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.reasonBreakdown} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="reason" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-xl border bg-background p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t("admin.abuse.topKeys")}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topKeys.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="key" tick={{ fontSize: 11 }} width={160} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="rounded-xl border bg-background shadow-sm">
            <h2 className="border-b p-4 text-sm font-medium text-muted-foreground">{t("admin.abuse.recent")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">{t("admin.abuse.cols.time")}</th>
                    <th className="p-3">{t("admin.abuse.cols.reason")}</th>
                    <th className="p-3">{t("admin.abuse.cols.key")}</th>
                    <th className="p-3">{t("admin.abuse.cols.session")}</th>
                    <th className="p-3">IP</th>
                    <th className="p-3">{t("admin.abuse.cols.count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">No events in this window.</td>
                    </tr>
                  ) : (
                    data.recent.map((r) => (
                      <tr key={String(r.id)} className="border-t">
                        <td className="p-3 whitespace-nowrap">{fmtDateTime(r.created_at as string)}</td>
                        <td className="p-3"><span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{r.reason as string}</span></td>
                        <td className="p-3 font-mono text-xs">{(r.key as string) ?? "—"}</td>
                        <td className="p-3 font-mono text-xs">{((r.session_id as string) ?? "").slice(0, 8) || "—"}</td>
                        <td className="p-3 font-mono text-xs">{((r.ip_hash as string) ?? "").slice(0, 8) || "—"}</td>
                        <td className="p-3">{(r.current_count as number | null) ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}

type ExportJob = {
  id: string;
  kind: string;
  filters: Record<string, unknown> | null;
  status: string;
  row_count: number | null;
  processed_rows: number | null;
  total_rows: number | null;
  pages_processed: number | null;
  storage_path: string | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  expires_at: string;
};

function ExportJobsPanel({
  jobs,
  onDownload,
  onRefresh,
  isFetching,
}: {
  jobs: ExportJob[];
  onDownload: (id: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
}) {
  const { t } = useTranslation();
  if (!jobs.length) return null;
  const badge = (s: string) => {
    const cls =
      s === "ready"
        ? "bg-emerald-500/10 text-emerald-600"
        : s === "failed"
          ? "bg-destructive/10 text-destructive"
          : s === "processing"
            ? "bg-blue-500/10 text-blue-600"
            : "bg-muted text-muted-foreground";
    return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{s}</span>;
  };
  return (
    <section className="rounded-xl border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-sm font-medium text-muted-foreground">{t("admin.abuse.jobs")}</h2>
        <button
          onClick={onRefresh}
          className="rounded-md border px-2 py-1 text-xs hover:bg-accent/10"
        >
          {isFetching ? t("admin.abuse.refreshing") : t("admin.abuse.refresh")}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">{t("admin.abuse.jobCols.created")}</th>
              <th className="p-3">{t("admin.abuse.jobCols.filters")}</th>
              <th className="p-3">{t("admin.abuse.jobCols.status")}</th>
              <th className="p-3 min-w-[180px]">{t("admin.abuse.jobCols.progress")}</th>
              <th className="p-3">{t("admin.abuse.jobCols.rows")}</th>
              <th className="p-3">{t("admin.abuse.jobCols.action")}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const f = j.filters ?? {};
              const expired = new Date(j.expires_at).getTime() < Date.now();
              const active = j.status === "queued" || j.status === "processing";
              const processed = j.processed_rows ?? 0;
              const total = j.total_rows ?? 0;
              const pct =
                j.status === "ready"
                  ? 100
                  : total > 0
                    ? Math.min(100, Math.round((processed / total) * 100))
                    : j.status === "processing"
                      ? null // indeterminate
                      : 0;
              return (
                <tr key={j.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{fmtDateTime(j.created_at)}</td>
                  <td className="p-3 font-mono text-xs">
                    {String(f.windowHours ?? "?")}h{f.reason ? ` · ${String(f.reason)}` : ""}
                  </td>
                  <td className="p-3">
                    {badge(expired && j.status === "ready" ? "expired" : j.status)}
                    {j.error && <p className="mt-1 text-xs text-destructive">{j.error}</p>}
                  </td>
                  <td className="p-3">
                    {active || j.status === "ready" ? (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          {pct === null ? (
                            <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500/60" />
                          ) : (
                            <div
                              className={`h-full rounded-full transition-all ${
                                j.status === "ready" ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          )}
                        </div>
                        <div className="text-[11px] tabular-nums text-muted-foreground">
                          {total > 0
                            ? `${fmtNumber(processed)} / ${fmtNumber(total)}`
                            : active
                              ? t("admin.abuse.preparing")
                              : "—"}
                          {(j.pages_processed ?? 0) > 0 && (
                            <> · {j.pages_processed} page{j.pages_processed === 1 ? "" : "s"}</>
                          )}
                          {pct !== null && <> · {pct}%</>}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">{j.row_count != null ? fmtNumber(j.row_count) : "—"}</td>
                  <td className="p-3">
                    {j.status === "ready" && !expired ? (
                      <button
                        onClick={() => onDownload(j.id)}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent/10"
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
