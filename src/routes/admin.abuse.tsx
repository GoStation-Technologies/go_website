import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { adminAbuseMetrics, adminAbuseExport } from "@/lib/abuse.functions";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
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
  windowHours: z.coerce.number().int().min(1).max(720).catch(24).default(24),
  reason: z.string().min(1).max(64).optional(),
});

export const Route = createFileRoute("/admin/abuse")({
  validateSearch: zodValidator(searchSchema),
  component: AbuseDashboard,
});

const WINDOWS = [
  { v: 1, label: "Last hour" },
  { v: 6, label: "Last 6 hours" },
  { v: 24, label: "Last 24 hours" },
  { v: 24 * 7, label: "Last 7 days" },
  { v: 24 * 30, label: "Last 30 days" },
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
  const { windowHours, reason } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { rows } = await adminAbuseExport({ data: { windowHours, reason, limit: 10000 } });
      const headers = ["id", "created_at", "reason", "key", "session_id", "ip_hash", "current_count", "lang", "metadata"];
      const esc = (v: unknown) => {
        if (v === null || v === undefined) return "";
        const s = typeof v === "object" ? JSON.stringify(v) : String(v);
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(",")),
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
    } finally {
      setExporting(false);
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
      ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const palette = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#ea580c"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Abuse events</h1>
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
                <SelectItem key={w.v} value={String(w.v)}>{w.label}</SelectItem>
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
              <SelectItem value="all">All reasons</SelectItem>
              {REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => refetch()}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent/10"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent/10 disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

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
            <Stat label="Total events" value={data.total} />
            <Stat label="Unique sessions" value={data.uniqueSessions} />
            <Stat label="Unique IPs" value={data.uniqueIps} />
            <Stat label="Top reason" value={data.reasonBreakdown[0]?.reason ?? "—"} />
          </div>

          <section className="rounded-xl border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Events over time</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="t" tickFormatter={timeFmt} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleString()} />
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
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">By reason</h2>
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
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Top keys</h2>
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
            <h2 className="border-b p-4 text-sm font-medium text-muted-foreground">Recent events</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Key</th>
                    <th className="p-3">Session</th>
                    <th className="p-3">IP</th>
                    <th className="p-3">Count</th>
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
                        <td className="p-3 whitespace-nowrap">{new Date(r.created_at as string).toLocaleString()}</td>
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
