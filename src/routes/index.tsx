import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import heroStation from "@/assets/hero-station.jpg";

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
        .select("id, slug, title_ar, title_en, excerpt_ar, excerpt_en, cover_url, published_at")
        .eq("is_published", true)
        .eq("kind", "news")
        .order("published_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

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
      {/* ============ HERO — airy editorial split ============ */}
      <section className="relative border-b border-border/60 bg-background">
        <div className="mx-auto grid max-w-[1440px] items-stretch md:grid-cols-2">
          {/* Left — copy */}
          <div className="flex flex-col justify-center px-6 py-20 md:px-14 md:py-28 lg:px-20 lg:py-32">
            <div className="max-w-xl space-y-8 animate-rise-in">
              <div className="inline-flex items-center gap-3">
                <span className="h-px w-8 bg-accent" />
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                  {t("home.awardBadge")}
                </span>
              </div>

              <h1 className="text-balance font-display text-[clamp(2.75rem,5.6vw,5rem)] font-extrabold leading-[1.02] tracking-tight text-foreground">
                <span className="block">{t("home.heroLine1")}</span>
                <span className="block text-accent">{t("home.heroLine2")}</span>
              </h1>

              <p className="max-w-lg text-pretty text-lg leading-relaxed text-foreground/70">
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
                  className="h-12 rounded-lg border-2 border-foreground bg-transparent px-7 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background"
                >
                  <Link to="/stations">
                    <MapPin className="me-2 h-4 w-4" />
                    {t("home.ctaStations")}
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-8 border-t border-border pt-8">
                {stats.slice(0, 3).map((s) => (
                  <div key={s.key} className="flex flex-col">
                    <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                      {s.val}
                    </span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {t(`home.${s.key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — visual */}
          <div className="relative min-h-[420px] overflow-hidden bg-secondary md:min-h-[720px]">
            <img
              src={heroStation}
              alt="GoStation flagship canopy in Saudi Arabia"
              width={1600}
              height={1600}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-foreground/10 via-transparent to-transparent" />

            {/* Floating KPI card */}
            <div className="absolute bottom-8 start-8 max-w-[280px] rounded-2xl border border-white/40 bg-white/95 p-5 shadow-elegant backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-base font-bold text-ink">
                    {t("home.alwaysReady")}
                  </div>
                  <div className="text-xs text-ink/60">{t("home.alwaysReadySub")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FuelTicker />

      {/* ============ AWARDS / TRUST STRIP ============ */}
      <section className="border-b bg-sand/60">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.key}
              className={`flex flex-col ${i > 0 ? "md:border-s md:border-border/60 md:ps-6" : ""}`}
            >
              <div className="font-display text-4xl font-black tracking-tight text-primary md:text-5xl">
                {s.val}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t(`home.${s.key}`)}
              </div>
            </div>
          ))}
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

      {/* ============ PULL QUOTE ============ */}
      <section className="relative overflow-hidden bg-hero-ink py-24 text-primary-foreground md:py-32">
        <div className="absolute inset-0 bg-grid-ink opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <span className="font-display text-3xl text-ember">"</span>
          </div>
          <blockquote className="mx-auto mt-8 max-w-4xl text-balance text-3xl font-medium leading-[1.25] md:text-4xl lg:text-5xl">
            {t("home.quote")}
          </blockquote>
          <div className="mt-8 text-sm uppercase tracking-[0.2em] text-ember-glow">
            {t("home.quoteAuthor")}
          </div>
          <div className="mt-1 text-xs text-primary-foreground/60">{t("home.quoteRole")}</div>
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

      {/* ============ VALUES ============ */}
      <section className="border-y bg-sand/50 py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="eyebrow">{t("home.valuesEyebrow")}</div>
            <h2 className="mt-4 text-balance text-4xl font-bold leading-[1.05] md:text-5xl">
              {t("home.valuesTitle")}
            </h2>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-border md:grid-cols-4">
            {values.map(({ icon: Icon, k }) => (
              <div
                key={k}
                className="group relative bg-background p-8 transition hover:bg-background"
              >
                <div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-primary/5 text-primary transition group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold">{t(`home.values.${k}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`home.values.${k}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ NEWS ============ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow">{t("home.newsEyebrow")}</div>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl">{t("home.newsTitle")}</h2>
          </div>
          <Link
            to="/media"
            className="hidden items-center gap-1.5 text-sm font-semibold text-accent hover:underline sm:inline-flex"
          >
            {t("common.viewAll")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(news.data ?? []).map((n) => (
            <Link key={n.id} to="/media/$slug" params={{ slug: n.slug }} className="group block">
              <article className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card transition duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant">
                <div className="relative aspect-[16/10] overflow-hidden bg-hero-ink">
                  <div className="absolute inset-0 bg-grid-ink opacity-40" />
                  <div className="absolute inset-0 grid place-items-center">
                    <img src={logoAsset.url} alt="" className="h-16 w-16 opacity-30" />
                  </div>
                  <div className="absolute end-3 top-3 rounded-full bg-ember px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                    {t("media.news")}
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {n.published_at
                      ? new Date(n.published_at).toLocaleDateString(lng === "ar" ? "ar-SA" : "en-US", {
                          year: "numeric",
                          month: "long",
                        })
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
          {(!news.data || news.data.length === 0) && (
            <div className="col-span-3 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              {t("media.empty")}
            </div>
          )}
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

      {/* ============ FINAL CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-hero-ink px-8 py-16 text-primary-foreground shadow-elegant md:px-16 md:py-20">
          <div className="absolute inset-0 bg-grid-ink opacity-40" aria-hidden />
          <div
            className="pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-ember opacity-25 blur-3xl animate-pulse-glow"
            aria-hidden
          />
          <div className="relative grid gap-8 md:grid-cols-[1.4fr_auto] md:items-center">
            <div>
              <div className="eyebrow text-ember-glow">{t("home.ctaBannerEyebrow")}</div>
              <h2 className="mt-4 text-balance text-4xl font-bold leading-[1.05] md:text-5xl">
                {t("home.ctaBanner")}
              </h2>
              <p className="mt-4 max-w-xl text-lg text-primary-foreground/75">
                {t("home.ctaBannerText")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-glow hover:bg-accent/90"
              >
                <Link to="/franchise">{t("nav.franchise")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/25 bg-transparent px-6 text-sm font-semibold text-primary-foreground hover:bg-white/10"
              >
                <Link to="/acquisitions">
                  <MapPin className="me-2 h-4 w-4" /> {t("nav.acquisitions")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function KpiChip({ className = "", label, val }: { className?: string; label: string; val: string }) {
  return (
    <div className={`glass-ink rounded-2xl px-3.5 py-2.5 shadow-elegant ${className}`}>
      <div className="font-display text-xl font-black leading-none text-primary-foreground">
        <span className="bg-gradient-to-r from-ember-glow to-ember bg-clip-text text-transparent">
          {val}
        </span>
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-primary-foreground/70">
        {label}
      </div>
    </div>
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
        <div className="absolute inset-0 bg-grid-ink opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute -end-20 -bottom-20 h-72 w-72 rounded-full bg-ember opacity-30 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-45"
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between gap-10">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ember text-accent-foreground shadow-glow">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-8 max-w-md font-display text-4xl font-bold leading-tight md:text-5xl">
              {title}
            </h3>
            <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-primary-foreground/75">
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
