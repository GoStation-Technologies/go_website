import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { FuelTicker } from "@/components/site/fuel-ticker";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  MapPin,
  Fuel,
  Truck,
  Store,
  Building2,
  Star,
  Sparkles,
  ShieldCheck,
  Leaf,
  Handshake,
  Zap,
  Play,
  Gift,
  BarChart3,
  QrCode,
  Wallet,
} from "lucide-react";
import heroAsset from "@/assets/hero-cinematic.jpg.asset.json";
import stationCanopy from "@/assets/station-canopy.jpg.asset.json";
import logoAsset from "@/assets/gostation-logo.png.asset.json";
import appPoints from "@/assets/go-app-points.jpg.asset.json";
import appReports from "@/assets/go-app-reports.jpg.asset.json";
import goQr from "@/assets/gostation-qr.png.asset.json";
import partnerLogo from "@/assets/gostation-logo.png.asset.json";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { StatCards } from "@/components/site/stat-cards";
import { MediaCarousel } from "@/components/site/media-carousel";


export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "GoStation — A station and more" },
      {
        name: "description",
        content:
          "GoStation — the fastest-growing fuel network in Saudi Arabia. 180+ stations, 13 regions, and a full station experience: fuel, retail, fleet, and franchise.",
      },
      { property: "og:title", content: "GoStation — A station and more" },
      {
        property: "og:description",
        content:
          "180+ stations. 13 regions. One brand redefining the Saudi station experience.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://org-story-weaver.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://org-story-weaver.lovable.app/" }],
  }),
});

function HomePage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);

  const news = useQuery({
    queryKey: ["home-news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news_articles")
        .select(
          "id, slug, kind, title_ar, title_en, excerpt_ar, excerpt_en, cover_url, published_at, event_date, event_location_ar, event_location_en",
        )
        .eq("is_published", true)
        .in("kind", ["news", "event", "video"])
        .order("published_at", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });


  const [mediaTab, setMediaTab] = useState<"all" | "news" | "event" | "video">("all");
  const homeMedia = (news.data ?? []).filter((n) => mediaTab === "all" || n.kind === mediaTab);

  const reviews = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_cache")
        .select("value")
        .eq("key", "google_reviews")
        .maybeSingle();
      return (
        (data?.value as { reviews: Array<{ author: string; rating: number; text: string; lang: string }> })?.reviews ?? []
      );
    },
  });

  const stats = [
    { key: "statsStations", val: "180+" },
    { key: "statsRegions", val: "13" },
    { key: "statsYears", val: "8" },
    { key: "statsDaily", val: "50k+" },
  ] as const;

  const services = [
    { icon: Fuel, k: "fuel", href: "/stations" },
    { icon: Store, k: "retail", href: "/franchise" },
    { icon: Truck, k: "fleet", href: "/contact" },
    { icon: Building2, k: "invest", href: "/acquisitions" },
  ] as const;

  const values = [
    { icon: Sparkles, k: "excellence" },
    { icon: ShieldCheck, k: "integrity" },
    { icon: Leaf, k: "community" },
    { icon: Handshake, k: "innovation" },
  ] as const;

  const regions = [
    "Riyadh", "Makkah", "Madinah", "Eastern", "Asir", "Tabuk",
    "Qassim", "Hail", "Jazan", "Najran", "Al-Baha", "Northern Borders", "Al-Jouf",
  ];

  return (
    <SiteLayout>
      {/* ============ HERO — full-bleed cinematic ============ */}
      <section className="relative isolate flex min-h-[100vh] flex-col overflow-hidden border-b border-border/60">
        {/* Interactive background: ken-burns zoom + pointer & scroll parallax */}
        <HeroBackdrop src={heroAsset.url} alt="GoStation flagship canopy in Saudi Arabia" />


        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-6 pb-16 pt-24 md:px-14 lg:px-20">

          <div className="max-w-2xl space-y-8 animate-rise-in">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-white/90">
                {t("home.awardBadge")}
              </span>
            </div>

            <h1 className="text-balance font-display text-[clamp(2.75rem,6vw,5.5rem)] font-extrabold leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
              <span className="block">{t("home.heroLine1")}</span>
              <span className="block text-accent">{t("home.heroLine2")}</span>
            </h1>

            <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/80">
              {t("home.heroSub")}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-lg bg-accent px-7 text-sm font-semibold text-accent-foreground shadow-glow transition hover:bg-accent/90"
              >
                <Link to="/franchise">
                  {t("home.ctaFranchise")}
                  <ArrowUpRight className="ms-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-lg border-2 border-white/70 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur hover:bg-white hover:text-ink"
              >
                <Link to="/stations">
                  <MapPin className="me-2 h-4 w-4" />
                  {t("home.ctaStations")}
                </Link>
              </Button>
            </div>

          </div>

          {/* Floating KPI card */}
          <div className="mt-8 max-w-[320px] rounded-2xl border border-white/25 bg-white/12 p-5 shadow-elegant backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Zap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-bold text-white">
                  {t("home.alwaysReady")}
                </div>
                <div className="text-xs text-white/70">{t("home.alwaysReadySub")}</div>
              </div>
            </div>
          </div>

        </div>

        {/* ============ TRUST STRIP — inside hero, over the backdrop ============ */}
        <div className="relative z-10">
          {/* soft white band behind the cards */}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 top-24 bg-background/95 backdrop-blur-sm"
          />
          <div className="relative">
            <StatCards
              stats={stats.map((s, i) => ({
                key: s.key,
                val: s.val,
                label: t(`home.${s.key}`),
                icon: [Fuel, MapPin, Star, Zap][i] ?? Fuel,
              }))}
            />
            <div className="mt-10">
              <FuelTicker />
            </div>
          </div>
        </div>

      </section>

      {/* ============ PULL QUOTE ============ */}
      <section className="relative overflow-hidden border-y border-border/60 bg-secondary/40 py-24 md:py-32">
        {/* soft wavy line grid backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'><path d='M0 30 Q 15 10 30 30 T 60 30 T 90 30 T 120 30' fill='none' stroke='%23123b34' stroke-width='1.1'/><path d='M0 58 Q 15 38 30 58 T 60 58 T 90 58 T 120 58' fill='none' stroke='%23123b34' stroke-width='1.1'/></svg>\")",
            backgroundSize: "120px 60px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/60 via-transparent to-secondary/60"
        />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border border-accent/30 bg-background p-4 shadow-card md:h-32 md:w-32">
            <img
              src={logoAsset.url}
              alt={t("home.quoteAuthor")}
              className="h-full w-full object-contain"
            />
          </div>
          <blockquote className="mx-auto mt-8 max-w-4xl text-balance font-display text-3xl font-semibold leading-[1.2] tracking-tight text-foreground md:text-4xl lg:text-5xl">
            {t("home.quote")}
          </blockquote>
          <div className="mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
            {t("home.quoteAuthor")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{t("home.quoteRole")}</div>
        </div>
      </section>



      {/* ============ VALUES ============ */}
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-ink py-20 text-white md:py-24">
        {/* subtle grid lines from brand identity */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.55) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black 40%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 40%, transparent 85%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 start-1/4 -z-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="eyebrow text-accent">{t("home.valuesEyebrow")}</div>
            <h2 className="mt-4 text-balance text-4xl font-bold leading-[1.05] text-white md:text-5xl">
              {t("home.valuesTitle")}
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-4">
            {values.map(({ icon: Icon, k }) => (
              <div key={k} className="group relative bg-ink p-8 transition hover:bg-white/[0.06]">
                <div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">
                  {t(`home.values.${k}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {t(`home.values.${k}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ============ SERVICES BENTO ============ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:items-end">
          <div>
            <div className="eyebrow">{t("home.servicesEyebrow")}</div>
            <h2 className="mt-4 text-balance text-4xl font-bold leading-[1.05] md:text-5xl">
              {t("home.servicesTitle")}
            </h2>
          </div>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t("home.servicesSub")}
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-6 md:grid-rows-2">
          {/* Featured — Fuel */}
          <ServiceCard
            className="md:col-span-4 md:row-span-2"
            featured
            icon={services[0].icon}
            title={t(`home.svc.${services[0].k}.title`)}
            body={t(`home.svc.${services[0].k}.body`)}
            href={services[0].href}
            cta={t("common.learnMore")}
          />
          <ServiceCard
            className="md:col-span-2"
            icon={services[1].icon}
            title={t(`home.svc.${services[1].k}.title`)}
            body={t(`home.svc.${services[1].k}.body`)}
            href={services[1].href}
            cta={t("common.learnMore")}
          />
          <ServiceCard
            className="md:col-span-1"
            compact
            icon={services[2].icon}
            title={t(`home.svc.${services[2].k}.title`)}
            body={t(`home.svc.${services[2].k}.body`)}
            href={services[2].href}
            cta={t("common.learnMore")}
          />
          <ServiceCard
            className="md:col-span-1"
            compact
            icon={services[3].icon}
            title={t(`home.svc.${services[3].k}.title`)}
            body={t(`home.svc.${services[3].k}.body`)}
            href={services[3].href}
            cta={t("common.learnMore")}
          />
        </div>
      </section>



      {/* ============ COVERAGE ============ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <div className="grid gap-14 md:grid-cols-[1fr_1fr] md:items-center">
          <div>
            <div className="eyebrow">{t("home.coverageEyebrow")}</div>
            <h2 className="mt-4 text-balance text-4xl font-bold leading-[1.05] md:text-5xl">
              {t("home.coverageTitle")}
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              {t("home.coverageSub")}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {regions.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-accent hover:text-accent"
                >
                  {r}
                </span>
              ))}
            </div>
            <Button
              asChild
              size="lg"
              className="mt-10 h-12 rounded-full bg-primary px-6 text-sm font-semibold shadow-elegant"
            >
              <Link to="/stations">
                {t("home.ctaStations")}
                <ArrowUpRight className="ms-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Stylised map card */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-hero-ink p-8 shadow-elegant">
              <div className="absolute inset-0 bg-grid-ink opacity-40" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between text-primary-foreground/70">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">KSA</span>
                  <span className="text-xs">2026</span>
                </div>
                {/* Dot cluster */}
                <div className="relative mt-4 aspect-[4/3] w-full">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const seed = (i * 9301 + 49297) % 233280;
                    const x = ((seed / 233280) * 90 + 5);
                    const y = (((i * 6151) % 233280) / 233280) * 90 + 5;
                    const big = i % 7 === 0;
                    return (
                      <span
                        key={i}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        className={`absolute rounded-full ${
                          big ? "h-2.5 w-2.5 bg-ember shadow-glow" : "h-1.5 w-1.5 bg-white/50"
                        }`}
                      />
                    );
                  })}
                  {/* Central pulse */}
                  <span className="absolute left-[46%] top-[52%] h-4 w-4 rounded-full bg-ember shadow-glow animate-pulse-glow" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-primary-foreground">
                  <div>
                    <div className="font-display text-3xl font-black text-ember">180+</div>
                    <div className="text-xs text-primary-foreground/60">{t("home.statsStations")}</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-black text-ember">13</div>
                    <div className="text-xs text-primary-foreground/60">{t("home.statsRegions")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ============ MEDIA CENTER ============ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow">{t("home.newsEyebrow")}</div>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl">{t("home.newsTitle")}</h2>
          </div>
          <Link
            to="/media"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            {t("common.viewAll")} <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {(["all", "news", "event", "video"] as const).map((k) => {
            const label =
              k === "all" ? t("media.all") : k === "news" ? t("media.news") : k === "event" ? t("media.events") : t("media.videos");
            const active = mediaTab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setMediaTab(k)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-accent text-accent-foreground shadow-glow"
                    : "border border-border bg-background text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          {homeMedia.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              {t("media.empty")}
            </div>
          ) : (
            <MediaCarousel>
              {homeMedia.map((n) => (
                <Link
                  key={n.id}
                  to="/media/$slug"
                  params={{ slug: n.slug }}
                  className="group w-[300px] shrink-0 snap-start sm:w-[360px]"
                >
                  <article className="relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card transition duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant">
                    <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                      {n.cover_url ? (
                        <img
                          src={n.cover_url}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
                      )}
                      {n.kind === "video" && (
                        <span className="absolute inset-0 grid place-items-center">
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow transition group-hover:scale-110">
                            <Play className="h-5 w-5 translate-x-[1px] rtl:-scale-x-100" />
                          </span>
                        </span>
                      )}
                      <span className="absolute end-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                        {n.kind === "event" ? t("media.events") : n.kind === "video" ? t("media.videos") : t("media.news")}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {(n.kind === "event" ? n.event_date : n.published_at)
                          ? new Date((n.kind === "event" ? n.event_date : n.published_at) as string).toLocaleDateString(
                              lng === "ar" ? "ar-EG-u-nu-latn" : "en-US",
                              { year: "numeric", month: "long", day: "numeric" },
                            )
                          : ""}
                      </div>
                      <h3 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-tight transition group-hover:text-accent">
                        {lng === "ar" ? n.title_ar : n.title_en}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {lng === "ar" ? n.excerpt_ar : n.excerpt_en}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </MediaCarousel>
          )}
        </div>
      </section>


      {/* ============ FINAL CTA — airy band ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div
          className="relative overflow-hidden rounded-[2rem] px-8 py-16 md:px-16 md:py-20"
          style={{
            backgroundImage: [
              "radial-gradient(120% 140% at 88% 12%, color-mix(in oklab, var(--accent) 62%, black) 0%, transparent 58%)",
              "radial-gradient(120% 130% at 8% 95%, color-mix(in oklab, var(--primary) 55%, black) 0%, transparent 62%)",
              "linear-gradient(115deg, color-mix(in oklab, var(--ink, var(--foreground)) 88%, black) 0%, color-mix(in oklab, var(--accent) 42%, color-mix(in oklab, var(--ink, var(--foreground)) 80%, black)) 55%, color-mix(in oklab, var(--ink, var(--foreground)) 92%, black) 100%)",
            ].join(", "),
          }}
        >
          {/* wavy line field */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.5]"
            viewBox="0 0 1200 400"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="ctaWave" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="color-mix(in oklab, var(--accent) 90%, white)" stopOpacity="0.05" />
                <stop offset="45%" stopColor="var(--accent)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="color-mix(in oklab, var(--accent) 60%, black)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {Array.from({ length: 14 }).map((_, i) => (
              <path
                key={i}
                d={`M-50 ${120 + i * 18} C 180 ${40 + i * 18}, 380 ${230 + i * 16}, 640 ${150 + i * 17} S 1020 ${60 + i * 18}, 1250 ${140 + i * 17}`}
                fill="none"
                stroke="url(#ctaWave)"
                strokeWidth={1.6}
              />
            ))}
          </svg>

          <div className="pointer-events-none absolute -end-24 -bottom-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -start-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" aria-hidden />

          <div className="relative grid gap-10 md:grid-cols-[1.4fr_auto] md:items-center">

            <div>
              <div className="eyebrow text-accent">{t("home.ctaBannerEyebrow")}</div>
              <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl">
                {t("home.ctaBanner")}
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/75">
                {t("home.ctaBannerText")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-lg bg-accent px-7 text-sm font-semibold text-accent-foreground shadow-glow transition hover:bg-accent/90"
              >
                <Link to="/franchise">{t("nav.franchise")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-lg border-2 border-white/60 bg-transparent px-7 text-sm font-semibold text-white hover:bg-white hover:text-ink"
              >
                <Link to="/acquisitions">
                  <MapPin className="me-2 h-4 w-4" /> {t("nav.acquisitions")}
                </Link>
              </Button>
            </div>
          </div>
        </div>

      </section>

      {/* ============ REVIEWS ============ */}
      {(reviews.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="max-w-2xl">
            <div className="eyebrow">{t("home.reviewsEyebrow")}</div>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl">{t("home.reviewsTitle")}</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(reviews.data ?? []).slice(0, 3).map((r, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-card p-8 transition hover:-translate-y-1 hover:shadow-card"
              >
                <div className="flex items-center gap-0.5 text-ember">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">"{r.text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {r.author?.[0] ?? "G"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{r.author}</div>
                    <div className="text-xs text-muted-foreground">Google review</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* ============ GO APP ============ */}
      <section className="relative overflow-hidden bg-ink py-20 text-white md:py-28">
        {/* base brand gradient: navy → deep blue with an ember warmth */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(135deg, color-mix(in oklab, var(--ember) 16%, transparent) 0%, transparent 42%), linear-gradient(215deg, color-mix(in oklab, var(--primary) 34%, transparent) 0%, transparent 55%), radial-gradient(120% 90% at 50% 120%, color-mix(in oklab, var(--ember) 12%, transparent) 0%, transparent 60%)",
          }}
        />
        {/* soft aurora glows */}
        <div className="pointer-events-none absolute -start-40 top-1/3 h-[38rem] w-[38rem] -translate-y-1/3 rounded-full bg-[var(--ember)]/18 blur-[150px]" aria-hidden />
        <div className="pointer-events-none absolute -end-48 -top-32 h-[34rem] w-[34rem] rounded-full bg-primary/25 blur-[160px]" aria-hidden />
        <div className="pointer-events-none absolute bottom-[-14rem] start-1/3 h-[28rem] w-[28rem] rounded-full bg-[var(--ember)]/10 blur-[140px]" aria-hidden />
        {/* faint grid, fading out at the edges */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(120% 80% at 50% 40%, black 30%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(120% 80% at 50% 40%, black 30%, transparent 85%)",
          }}
        />
        {/* smooth blend into the neighbouring sections */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" aria-hidden />


        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
          {/* tilted phone showcase */}
          <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
            <div className="relative [perspective:1400px]">
              {/* back phone */}
              <div className="absolute -start-16 top-10 hidden w-48 rotate-[-10deg] rounded-[2rem] border border-white/12 bg-white/[0.04] p-1.5 shadow-elegant backdrop-blur-sm sm:block">
                <img
                  src={appReports.url}
                  alt={t("goapp.imgReportsAlt")}
                  loading="lazy"
                  className="aspect-[9/18] w-full rounded-[1.6rem] object-cover opacity-80"
                />
              </div>
              {/* front phone */}
              <div className="relative w-60 rounded-[2.4rem] border border-white/20 bg-gradient-to-b from-white/15 to-white/5 p-2 shadow-elegant ring-1 ring-white/10 [transform:rotateY(-14deg)_rotateX(4deg)_rotate(3deg)] sm:w-72">
                <div className="absolute start-1/2 top-3 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/40" aria-hidden />
                <img
                  src={appPoints.url}
                  alt={t("goapp.imgPointsAlt")}
                  loading="lazy"
                  className="aspect-[9/18] w-full rounded-[1.9rem] object-cover"
                />
              </div>
            </div>
          </div>

          {/* copy + stores */}
          <div className="text-center lg:text-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-[var(--ember)]" /> {t("goapp.eyebrow")}
            </div>
            <h2 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-[3.4rem]">
              {t("goapp.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0">
              {t("goapp.sub")}
            </p>

            {/* store badges */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <a
                href="#"
                className="group inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-ink shadow-elegant transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <PlayIcon className="h-7 w-7" />
                <span className="text-start leading-tight">
                  <span className="block text-[0.65rem] font-medium opacity-70">{t("goapp.storeGoogleTop")}</span>
                  <span className="block font-display text-lg font-bold">Google Play</span>
                </span>
              </a>
              <a
                href="#"
                className="group inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-ink shadow-elegant transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <AppleIcon className="h-7 w-7" />
                <span className="text-start leading-tight">
                  <span className="block text-[0.65rem] font-medium opacity-70">{t("goapp.storeAppleTop")}</span>
                  <span className="block font-display text-lg font-bold">App Store</span>
                </span>
              </a>
            </div>

            {/* feature chips */}
            <div className="mt-9 flex flex-wrap justify-center gap-2.5 lg:justify-start">
              {[
                { icon: Gift, k: "points" },
                { icon: BarChart3, k: "reports" },
                { icon: Wallet, k: "wallet" },
                { icon: QrCode, k: "pay" },
              ].map(({ icon: Icon, k }) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-[var(--ember)]/50 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-[var(--ember)]" />
                  {t(`goapp.f.${k}.title`)}
                </span>
              ))}
            </div>

            {/* QR */}
            <div className="mt-9 inline-flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-start backdrop-blur-sm">
              <img
                src={goQr.url}
                alt={t("goapp.qrAlt")}
                loading="lazy"
                className="h-16 w-16 rounded-xl bg-white p-1 object-contain ring-1 ring-white/20"
              />

              <div className="text-sm text-white/70">
                <div className="font-display text-sm font-bold text-white">{t("goapp.downloadTitle")}</div>
                <p className="mt-0.5 max-w-[16rem] text-xs">{t("goapp.downloadSub")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PARTNERS / TRUSTED BY ============ */}
      <section className="border-t border-border/60 bg-secondary/30 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("home.partnersTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {t("home.partnersSub")}
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              "Aramco",
              "Saudia",
              "Panda",
              "Almarai",
              "SABIC",
              "Tamimi Markets",
              "Bidaya",
              "Nesto",
            ].map((name) => (
              <div
                key={name}
                className="group flex h-28 flex-col items-center justify-center gap-2.5 rounded-2xl border border-border/70 bg-background px-4 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant"
              >
                <img
                  src={partnerLogo.url}
                  alt={name}
                  loading="lazy"
                  className="h-10 w-10 opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                />
                <span className="font-display text-sm font-semibold tracking-tight text-muted-foreground transition duration-300 group-hover:text-foreground md:text-base">
                  {name}
                </span>
              </div>
            ))}
          </div>



          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 rounded-full border-2 border-accent/40 bg-transparent px-6 text-sm font-semibold text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Link to="/media">{t("home.partnersStories")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-11 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              <Link to="/contact">{t("home.partnersCta")}</Link>
            </Button>
          </div>
        </div>
      </section>


    </SiteLayout>
  );
}


function ServiceCard({
  className = "",
  featured,
  compact,
  icon: Icon,
  title,
  body,
  href,
  cta,
}: {
  className?: string;
  featured?: boolean;
  compact?: boolean;
  icon: typeof Fuel;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  if (featured) {
    return (
      <Link
        to={href as never}
        className={`group relative overflow-hidden rounded-3xl bg-hero-ink p-10 text-primary-foreground shadow-elegant transition hover:-translate-y-1 ${className}`}
      >
        <img
          src={stationCanopy.url}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[50%_38%] transition-transform duration-[1400ms] ease-out group-hover:scale-110"
        />
        {/* GoStation brand scrim — deep navy night + ember (keeps photo visible) */}
        <div
          className="absolute inset-0 bg-ink/60"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/65 to-ink/40"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-ink/55 via-transparent to-ember/25"
          aria-hidden
        />
        <div className="absolute inset-0 bg-grid-ink opacity-20" aria-hidden />

        <div
          className="pointer-events-none absolute -end-20 -bottom-20 h-72 w-72 rounded-full bg-ember opacity-30 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-45"
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col justify-between gap-10">

          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ember text-accent-foreground shadow-glow">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-8 max-w-md font-display text-4xl font-bold leading-tight text-white [text-shadow:0_2px_24px_rgba(4,10,22,0.85)] md:text-5xl">
              {title}
            </h3>
            <p className="mt-4 max-w-lg text-pretty text-base font-medium leading-relaxed text-white [text-shadow:0_2px_16px_rgba(4,10,22,0.9)]">
              {body}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-sm font-semibold text-ember-glow">
            {cta}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link
      to={href as never}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant ${className}`}
    >
      <div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary transition group-hover:bg-accent group-hover:text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className={`mt-5 font-display font-bold leading-tight ${compact ? "text-lg" : "text-2xl"}`}>
          {title}
        </h3>
        {!compact && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        )}
      </div>
      <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
        {cta}
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden focusable="false">
      <path fill="#00D2FF" d="M47 24 316 256 47 488c-9-6-15-17-15-30V54c0-13 6-24 15-30z" />
      <path fill="#00F076" d="M47 24c8-5 18-5 28 1l282 158-41 73L47 24z" />
      <path fill="#FFCE00" d="M357 183l70 39c22 12 22 44 0 56l-70 39-41-61 41-73z" />
      <path fill="#FF3A44" d="M75 487c-10 6-20 6-28 1l269-232 41 73-282 158z" />
    </svg>
  );
}

function AppleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden focusable="false">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}
