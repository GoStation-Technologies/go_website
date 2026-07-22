import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { adminOverviewStats } from "@/lib/admin.functions";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MapPin,
  Newspaper,
  Briefcase,
  Inbox,
  MessageSquare,
  ShieldAlert,
  FileDown,
  Handshake,
  Mail,
} from "lucide-react";
import type { ComponentType } from "react";

const RANGE_OPTIONS = [
  { days: 7, label: "7d" },
  { days: 14, label: "14d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
] as const;

const searchSchema = z.object({
  days: fallback(z.number().int().min(1).max(90), 14).default(14),
});

export const Route = createFileRoute("/admin/")({
  validateSearch: zodValidator(searchSchema),
  component: Overview,
});

type Kpi = {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  to: string;
  search?: Record<string, unknown>;
  accent?: "primary" | "warn" | "danger";
};

function Overview() {
  const { days } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/" });
  const { data } = useSuspenseQuery({
    queryKey: ["admin", "overview", days],
    queryFn: () => adminOverviewStats({ data: { days } }),
    refetchInterval: 60_000,
  });

  const hours = days * 24;
  const chatsLabel = days === 1 ? "Chatbot messages (24h)" : `Chatbot messages (${days}d)`;
  const abuseLabel = days === 1 ? "Abuse events (24h)" : `Abuse events (${days}d)`;
  const chatsTotal = data.chatsSeries.reduce((a, b) => a + b.count, 0);
  const abuseTotal = data.abuseSeries.reduce((a, b) => a + b.count, 0);

  const kpis: Kpi[] = [
    { label: "Stations", value: data.stations, icon: MapPin, to: "/admin/stations" },
    { label: "Published news", value: data.news, icon: Newspaper, to: "/admin/news" },
    { label: "Active job openings", value: data.activeJobs, icon: Briefcase, to: "/admin/careers" },
    { label: "New franchise applications", value: data.pendingFranchise, icon: Handshake, to: "/admin/submissions", search: { kind: "franchise", status: "new", days }, accent: "warn" },
    { label: "New acquisition requests", value: data.pendingAcquisitions, icon: Inbox, to: "/admin/submissions", search: { kind: "acquisitions", status: "new", days }, accent: "warn" },
    { label: "Unread contact messages", value: data.unreadContacts, icon: Mail, to: "/admin/submissions", search: { kind: "contact", status: "new", days }, accent: "warn" },
    { label: chatsLabel, value: chatsTotal, icon: MessageSquare, to: "/admin/chats", search: { sinceHours: hours }, accent: "primary" },
    { label: abuseLabel, value: abuseTotal, icon: ShieldAlert, to: "/admin/abuse", search: { windowHours: hours }, accent: abuseTotal > 0 ? "danger" : undefined },
    { label: "Export jobs running", value: data.exportsRunning, icon: FileDown, to: "/admin/abuse" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Live activity across GoStation — last {days} days.</p>
        </div>
        <div
          role="tablist"
          aria-label="Time range"
          className="inline-flex items-center rounded-lg border bg-background p-1 shadow-sm"
        >
          {RANGE_OPTIONS.map((opt) => {
            const active = opt.days === days;
            return (
              <button
                key={opt.days}
                role="tab"
                aria-selected={active}
                onClick={() =>
                  navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, days: opt.days }) })
                }
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Chatbot messages" subtitle={`Daily volume, last ${days} days`}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.chatsSeries} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gChats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tickFormatter={fmtDay} fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDate} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#gChats)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Franchise applications" subtitle="Daily submissions">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.franchiseSeries} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tickFormatter={fmtDay} fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDate} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Abuse events" subtitle="Blocked or flagged requests" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.abuseSeries} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tickFormatter={fmtDay} fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDate} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

function fmtDay(v: string) {
  const d = new Date(v);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtDate(v: string) {
  const d = new Date(v);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const accent =
    kpi.accent === "danger"
      ? "text-destructive"
      : kpi.accent === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-primary";
  const Icon = kpi.icon;
  return (
    <Link
      to={kpi.to as never}
      search={kpi.search as never}
      className="group rounded-xl border bg-background p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{kpi.label}</p>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{kpi.value.toLocaleString()}</p>
    </Link>
  );
}

function ChartCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border bg-background p-5 shadow-sm ${className ?? ""}`}>
      <div className="mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
