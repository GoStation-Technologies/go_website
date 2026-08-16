import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { logReportDownload } from "@/lib/reports.functions";
import { SiteLayout } from "@/components/site/site-layout";
import { RoiCalculator } from "@/components/site/roi-calculator";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Eye, FileDown } from "lucide-react";
import stationCanopy from "@/assets/station-canopy.jpg.asset.json";
import logoWhite from "@/assets/gostation-logo-white.png.asset.json";



export const Route = createFileRoute("/investors")({
  component: IRPage,
  head: () =>
    pageHead({
      path: "/investors",
      title: "Investor Relations — GoStation Reports & Governance",
      description:
        "GoStation investor relations: financial reports, growth highlights, governance documents and contacts for shareholders and prospective investors.",
    }),
});

function IRPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const { data: reports = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_reports").select("*").eq("is_published", true).order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  const railRef = useRef<HTMLDivElement>(null);
  const scrollRail = (dir: number) => {
    const el = railRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * 296 * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await supabase.from("ir_inquiries").insert({
      full_name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone") ?? "") || null,
      organization: String(fd.get("org") ?? "") || null,
      inquiry_type: String(fd.get("type")),
      message: String(fd.get("message")),
    }).select("reference").single();
    setBusy(false);
    if (error) return toast.error(t("common.error"));
    setRef(data.reference);
    toast.success(t("common.thanks"));
    (e.target as HTMLFormElement).reset();
  };

  const kpis: KpiConfig[] = [
    {
      label: t("investors.kpiRevenue"),
      value: "3.2B",
      unit: lng === "ar" ? "ريال" : "SAR",
      trend: "+12%",
      chart: "area",
      data: [0.35, 0.42, 0.5, 0.56, 0.68, 0.82, 1.0],
    },
    {
      label: t("investors.kpiGrowth"),
      value: "+18%",
      unit: "",
      trend: lng === "ar" ? "سنوياً" : "YoY",
      chart: "bar",
      data: [0.45, 0.55, 0.62, 0.75, 0.82, 0.92, 1.0],
    },
    {
      label: t("investors.kpiStations"),
      value: "180+",
      unit: lng === "ar" ? "محطة" : "stations",
      trend: "+24",
      chart: "step",
      data: [0.25, 0.38, 0.45, 0.58, 0.72, 0.88, 1.0],
    },
  ];

  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <img
          src={stationCanopy.url}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
        />
        <div className="absolute inset-0 bg-ink/80" />
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(900px 520px at 78% -10%, color-mix(in oklab, var(--ember) 20%, transparent), transparent 62%), linear-gradient(180deg, color-mix(in oklab, var(--ink) 55%, transparent) 0%, color-mix(in oklab, var(--ink) 88%, transparent) 70%, var(--background) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-44 pt-28 text-center md:pb-52 md:pt-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs tracking-wide backdrop-blur-sm">
            {t("investors.title")}
          </span>
          <h1 className="mt-5 text-balance text-3xl font-extrabold leading-tight md:text-5xl">
            {t("investors.heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-white/75 md:text-base">
            {t("investors.heroBody")}
          </p>
        </div>
      </section>

      <section className="relative z-10 -mt-28 px-4 md:-mt-32">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-elegant backdrop-blur-xl">
          <div className="grid divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse">
            {kpis.map((k) => (
              <KpiCard key={k.label} kpi={k} />
            ))}
          </div>
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-4 pt-20 md:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
              {t("investors.govEyebrow")}
            </span>
            <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("investors.govTitle")}
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{t("investors.govBody")}</p>

            <div className="mt-8 rounded-2xl border border-border/60 bg-muted/40 p-6">
              <h3 className="font-display text-lg font-bold">{t("investors.govGoalTitle")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("investors.govGoalBody")}</p>
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold">{t("investors.govPillarsTitle")}</h3>
            <ol className="mt-5 space-y-4">
              {["govP1", "govP2", "govP3"].map((k, i) => (
                <li
                  key={k}
                  className="flex items-start gap-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-accent/60"
                >
                  <span className="text-3xl font-extrabold leading-none text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-foreground/85">{t(`investors.${k}`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-20 md:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
              {t("investors.reportsEyebrow")}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">{t("investors.reportsTitle")}</h2>
        </div>

        <div className="mt-10 flex items-start gap-6">
          <div className="hidden shrink-0 flex-col items-center gap-4 pt-16 md:flex">
            <button
              type="button"
              aria-label={t("investors.prev")}
              onClick={() => scrollRail(-1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-border/70 text-foreground/70 transition hover:border-accent hover:text-accent"
            >
              <ArrowRight className="h-5 w-5 rtl:hidden" />
              <ArrowLeft className="hidden h-5 w-5 rtl:block" />
            </button>
            <button
              type="button"
              aria-label={t("investors.next")}
              onClick={() => scrollRail(1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-border/70 text-foreground/70 transition hover:border-accent hover:text-accent"
            >
              <ArrowLeft className="h-5 w-5 rtl:hidden" />
              <ArrowRight className="hidden h-5 w-5 rtl:block" />
            </button>
            {reports.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                <span className="text-2xl font-bold text-foreground">{String(reports.length).padStart(2, "0")}</span>
              </div>
            )}
          </div>

          <div
            ref={railRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reports.length === 0 && <p className="text-muted-foreground">{t("investors.reportsEmpty")}</p>}
            {reports.map((r) => (
              <article key={r.id} className="w-[248px] shrink-0 snap-start md:w-[272px]">
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block aspect-square overflow-hidden rounded-[2rem] bg-ink shadow-elegant transition duration-500 hover:-translate-y-1"
                >
                  <span
                    className="absolute inset-0 opacity-70 transition duration-500 group-hover:opacity-90"
                    aria-hidden
                    style={{
                      background:
                        "radial-gradient(420px 260px at 20% 0%, color-mix(in oklab, var(--ember) 26%, transparent), transparent 65%)",
                    }}
                  />
                  <img
                    src={logoWhite.url}
                    alt=""
                    aria-hidden
                    className="absolute start-7 top-8 h-11 w-auto opacity-95"
                  />
                  <span className="absolute -bottom-3 start-6 select-none text-[5.5rem] font-black leading-none tracking-tight text-white/95 md:text-[6.5rem]">
                    {r.report_year}
                  </span>
                </a>
                <div className="mt-5 space-y-1.5">
                  <div className="text-xs text-muted-foreground">
                    {t(`investors.reportTypes.${r.report_type}`, { defaultValue: r.report_type })}
                  </div>
                  <h3 className="text-base font-semibold leading-snug">{lng === "ar" ? r.title_ar : r.title_en}</h3>
                  <div className="flex items-center gap-5 pt-2 text-sm">
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-accent"
                    >
                      <Eye className="h-4 w-4" />
                      {t("investors.view")}
                    </a>
                    <a
                      href={r.file_url}
                      download
                      onClick={() => {
                        void logReportDownload({ data: { reportId: r.id } }).catch(() => {});
                      }}
                      className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-accent"
                    >
                      <FileDown className="h-4 w-4" />
                      {t("investors.download")}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <RoiCalculator />

      <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-elegant md:p-10">
          <h2 className="mb-4 text-2xl font-bold">{t("investors.roi.howItWorksTitle")}</h2>
          <p className="leading-relaxed text-muted-foreground">{t("investors.roi.howItWorksIntro")}</p>
          <h3 className="mt-6 mb-3 font-semibold">{t("investors.roi.howItWorksInputsTitle")}</h3>
          <ol className="list-decimal space-y-3 ps-5 leading-relaxed text-muted-foreground">
            <li>{t("investors.roi.howItWorksInput1")}</li>
            <li>{t("investors.roi.howItWorksInput2")}</li>
            <li>{t("investors.roi.howItWorksInput3")}</li>
            <li>{t("investors.roi.howItWorksInput4")}</li>
          </ol>
          <p className="mt-5 leading-relaxed text-muted-foreground">{t("investors.roi.howItWorksResult")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">

        <h2 className="mb-2 text-2xl font-bold">{t("investors.contact")}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t("investors.contactSub")}</p>
        <Card><CardContent className="p-8">
          {ref && <div className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">{t("common.referenceSaved")} <span className="font-mono">{ref}</span></div>}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <F label={t("common.fullName")}><Input name="name" required /></F>
            <F label={t("common.email")}><Input type="email" name="email" required /></F>
            <F label={t("common.phone")}><Input name="phone" /></F>
            <F label="Organization"><Input name="org" /></F>
            <F label="Inquiry type" className="sm:col-span-2">
              <Select name="type" defaultValue="general" required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="press">Press</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label={t("common.message")} className="sm:col-span-2"><Textarea rows={5} name="message" required /></F>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {busy ? t("common.submitting") : t("common.submit")}
              </Button>
            </div>
          </form>
        </CardContent></Card>
      </section>
    </SiteLayout>
  );
}

type KpiConfig = {
  label: string;
  value: string;
  unit: string;
  trend: string;
  chart: "area" | "bar" | "step";
  data: number[];
};

function KpiCard({ kpi }: { kpi: KpiConfig }) {
  const strokePath = buildPath(kpi.data, kpi.chart);
  const fillPath = buildFillPath(kpi.data, kpi.chart);

  return (
    <div className="group relative flex flex-col items-start gap-4 px-6 py-8 sm:px-8 sm:py-10 md:py-12">
      <div className="w-full">
        <div className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
          {kpi.value}
          {kpi.unit && (
            <span className="ms-2 text-lg font-bold text-primary/80 md:text-xl">{kpi.unit}</span>
          )}
        </div>
        <div className="mt-1 text-sm font-medium text-muted-foreground">{kpi.label}</div>
      </div>

      <div className="relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] px-4 py-5">
        <svg
          viewBox="0 0 200 64"
          preserveAspectRatio="none"
          className="h-16 w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>

          {kpi.chart !== "bar" && <path d={fillPath} fill="url(#fillGrad)" />}
          {kpi.chart !== "bar" && (
            <path
              d={strokePath}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
          )}

          {kpi.chart === "bar" &&
            kpi.data.map((d, i) => {
              const barWidth = 18;
              const gap = 10;
              const x = i * (barWidth + gap) + gap;
              const h = d * 52;
              const y = 60 - h;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={4}
                  fill={i === kpi.data.length - 1 ? "var(--accent)" : "var(--primary)"}
                  fillOpacity={i === kpi.data.length - 1 ? 1 : 0.35}
                />
              );
            })}

          {kpi.chart !== "bar" && (
            <circle cx="192" cy={8} r={5} fill="var(--accent)" className="shadow-glow" />
          )}
        </svg>

        <div className="absolute bottom-0 start-0 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </div>
  );
}

function buildPath(data: number[], type: "area" | "bar" | "step"): string {
  const w = 200;
  const h = 64;
  const pad = 6;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - d * (h - pad * 2);
    return { x, y };
  });

  if (type === "area") {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    d += ` L ${prev.x.toFixed(1)} ${curr.y.toFixed(1)} L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

function buildFillPath(data: number[], type: "area" | "bar" | "step"): string {
  const w = 200;
  const h = 64;
  const pad = 6;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - d * (h - pad * 2);
    return { x, y };
  });

  let d = `M ${points[0].x.toFixed(1)} ${h - pad}`;
  if (type === "area") {
    d += ` L ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
  } else {
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
      } else {
        const prev = points[i - 1];
        d += ` L ${prev.x.toFixed(1)} ${points[i].y.toFixed(1)} L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
      }
    }
  }
  d += ` L ${points[points.length - 1].x.toFixed(1)} ${h - pad} Z`;
  return d;
}

function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={"grid gap-1.5 " + className}><Label>{label}</Label>{children}</div>;
}
