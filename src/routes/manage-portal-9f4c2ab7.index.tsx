import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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
import { digitLocale } from "@/lib/format";

const RANGE_OPTIONS = [
  { days: 7, label: "7d" },
  { days: 14, label: "14d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
] as const;

const searchSchema = z.object({
  days: fallback(z.number().int().min(1).max(90), 14).default(14),
});

export const Route = createFileRoute("/manage-portal-9f4c2ab7/")({
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
  const { t, i18n } = useTranslation();
  const rtl = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");
  const locale = digitLocale(i18n.resolvedLanguage ?? i18n.language);
  const { days } = Route.useSearch();
  const navigate = useNavigate({ from: "/manage-portal-9f4c2ab7/" });
  const { data } = useSuspenseQuery({
    queryKey: ["admin", "overview", days],
    queryFn: () => adminOverviewStats({ data: { days } }),
    refetchInterval: 60_000,
  });

  const hours = days * 24;
  const chatsLabel = t("admin.kpi.chats", { days });
  const abuseLabel = t("admin.kpi.abuse", { days });
  const chatsTotal = data.chatsSeries.reduce((a, b) => a + b.count, 0);
  const abuseTotal = data.abuseSeries.reduce((a, b) => a + b.count, 0);

  const kpis: Kpi[] = [
    { label: t("admin.kpi.stations"), value: data.stations, icon: MapPin, to: "/manage-portal-9f4c2ab7/stations" },
    { label: t("admin.kpi.news"), value: data.news, icon: Newspaper, to: "/manage-portal-9f4c2ab7/news" },
    { label: t("admin.kpi.activeJobs"), value: data.activeJobs, icon: Briefcase, to: "/manage-portal-9f4c2ab7/careers" },
    { label: t("admin.kpi.franchise"), value: data.pendingFranchise, icon: Handshake, to: "/manage-portal-9f4c2ab7/submissions", search: { kind: "franchise", status: "new", days }, accent: "warn" },
    { label: t("admin.kpi.acquisitions"), value: data.pendingAcquisitions, icon: Inbox, to: "/manage-portal-9f4c2ab7/submissions", search: { kind: "acquisitions", status: "new", days }, accent: "warn" },
    { label: t("admin.kpi.contacts"), value: data.unreadContacts, icon: Mail, to: "/manage-portal-9f4c2ab7/submissions", search: { kind: "contact", status: "new", days }, accent: "warn" },
    { label: chatsLabel, value: chatsTotal, icon: MessageSquare, to: "/manage-portal-9f4c2ab7/chats", search: { sinceHours: hours }, accent: "primary" },
    { label: abuseLabel, value: abuseTotal, icon: ShieldAlert, to: "/manage-portal-9f4c2ab7/abuse", search: { windowHours: hours }, accent: abuseTotal > 0 ? "danger" : undefined },
    { label: t("admin.kpi.exports"), value: data.exportsRunning, icon: FileDown, to: "/manage-portal-9f4c2ab7/abuse" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">{t("admin.overview.title")}</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {t("admin.overview.subtitle", { days })}
          </p>
        </div>
        <div
          role="tablist"
          aria-label={t("admin.overview.timeRange")}
          className="admin-card inline-flex items-center gap-0.5 p-1.5"
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
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition ${
                  active
                    ? "bg-ember text-white shadow-glow"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>


      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} locale={locale} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <ChartCard title={t("admin.charts.chats")} subtitle={t("admin.charts.chatsSub", { days })}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.chatsSeries} margin={rtl ? { top: 8, right: -20, bottom: 0, left: 8 } : { top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gChats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" reversed={rtl} tickFormatter={(v: string) => fmtDay(v, locale)} fontSize={11} />
              <YAxis allowDecimals={false} orientation={rtl ? "right" : "left"} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(v: string) => fmtDate(v, locale)} />
              <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="url(#gChats)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin.charts.franchise")} subtitle={t("admin.charts.franchiseSub")}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.franchiseSeries} margin={rtl ? { top: 8, right: -20, bottom: 0, left: 8 } : { top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" reversed={rtl} tickFormatter={(v: string) => fmtDay(v, locale)} fontSize={11} />
              <YAxis allowDecimals={false} orientation={rtl ? "right" : "left"} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(v: string) => fmtDate(v, locale)} />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin.charts.abuse")} subtitle={t("admin.charts.abuseSub")} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.abuseSeries} margin={rtl ? { top: 8, right: -20, bottom: 0, left: 8 } : { top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" reversed={rtl} tickFormatter={(v: string) => fmtDay(v, locale)} fontSize={11} />
              <YAxis allowDecimals={false} orientation={rtl ? "right" : "left"} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(v: string) => fmtDate(v, locale)} />
              <Line type="monotone" dataKey="count" stroke="var(--destructive)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

function fmtDay(v: string, locale = "en-US") {
  const d = new Date(v);
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}
function fmtDate(v: string, locale = "en-US") {
  const d = new Date(v);
  return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

function KpiCard({ kpi, locale }: { kpi: Kpi; locale: string }) {
  const accent =
    kpi.accent === "danger"
      ? "text-destructive"
      : kpi.accent === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-accent";
  const Icon = kpi.icon;
  return (
    <Link
      to={kpi.to as never}
      search={kpi.search as never}
      className="admin-card group relative overflow-hidden p-6 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-elegant"
    >
      <span className="bg-ember absolute inset-x-0 top-0 h-0.5 opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-muted-foreground">
          {kpi.label}
        </p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 transition group-hover:bg-accent/15">
          <Icon className={`h-4.5 w-4.5 ${accent}`} />
        </span>
      </div>
      <p className={`admin-metric mt-4 text-4xl ${accent}`}>{kpi.value.toLocaleString(locale)}</p>
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
    <div className={`admin-card p-5 sm:p-6 ${className ?? ""}`}>
      <div className="mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
