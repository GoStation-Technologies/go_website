import { BusinessApplicationForm } from "@/components/site/business-application-form";
import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useTranslation } from "react-i18next";
import { usePageContent } from "@/hooks/use-cms";
import { useStationStats } from "@/hooks/use-station-stats";
import { SiteLayout } from "@/components/site/site-layout";

import { Card, CardContent } from "@/components/ui/card";
import { Quote, Fuel, Handshake, Award, BarChart3, GraduationCap, Network, TrendingUp, Truck } from "lucide-react";
const stationImg = { url: "/images/station-canopy.jpg" };
const heroStationImg = { url: "/images/franchise-station.jpg" };



export const Route = createFileRoute("/franchise")({
  component: FranchisePage,
  head: () =>
    pageHead({
      path: "/franchise",
      title: "Franchise application — GoStation",
      description:
        "Partner with GoStation and operate your own fuel station in Saudi Arabia. Review the requirements and submit your franchise application in one simple form.",
    }),
});

function FranchisePage() {
  const { t } = useTranslation();
  const cms = usePageContent("franchise");
  const { stationsCount, activeRegionsCount } = useStationStats();
  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden bg-brand-radial py-20 text-white md:py-24">
        {/* brand gradient washes */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 420px at 12% 0%, color-mix(in oklab, var(--accent) 32%, transparent), transparent 65%), radial-gradient(700px 380px at 95% 110%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%)",
          }}
        />
        {/* accent edge */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

        {/* station photo blended into the gradient */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
          <img
            src={heroStationImg.url}
            alt=""
            className="h-full w-full scale-[1.12] object-cover object-[62%_40%] opacity-80"
            style={{
              maskImage:
                "radial-gradient(120% 130% at 14% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.35) 62%, transparent 82%)",
              WebkitMaskImage:
                "radial-gradient(120% 130% at 14% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.35) 62%, transparent 82%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, color-mix(in oklab, var(--ink) 25%, transparent) 0%, color-mix(in oklab, var(--ink) 70%, transparent) 45%, color-mix(in oklab, var(--ink) 92%, transparent) 78%, var(--ink) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--ink) 0%, transparent 45%), radial-gradient(800px 460px at 20% 0%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 70%)",
            }}
          />
        </div>


        <div className="relative mx-auto max-w-7xl px-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            <Fuel className="h-3.5 w-3.5" />
            {t("franchise.about.eyebrow")}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
            {cms.field("hero", "title", t("franchise.title"))}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{cms.field("hero", "subtitle", t("franchise.intro"))}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-white/90">
              {t("franchise.about.statA", { stations: stationsCount })}
            </span>
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-white/90">
              {t("franchise.about.statB", { regions: activeRegionsCount })}
            </span>
          </div>
        </div>
      </section>


      <section className="border-b bg-muted/30 py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl shadow-xl">
            <img
              src={stationImg.url}
              alt={t("franchise.about.imgAlt")}
              loading="lazy"
              className="h-[320px] w-full object-cover md:h-[420px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {t("franchise.about.eyebrow")}
            </p>
            <Quote className="mt-4 h-8 w-8 text-accent/70" />
            <h2 className="mt-3 text-2xl font-extrabold leading-snug md:text-3xl">
              {t("franchise.about.heading")}
            </h2>
            <p className="mt-4 text-lg text-foreground/80">{t("franchise.about.quote")}</p>
            <p className="mt-3 text-muted-foreground">{t("franchise.about.body")}</p>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
              <Handshake className="h-3.5 w-3.5" />
              {t("franchise.why.eyebrow")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">{cms.field("benefits", "title", t("franchise.why.title"))}</h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "brand", icon: Award },
              { key: "model", icon: BarChart3 },
              { key: "support", icon: GraduationCap },
              { key: "network", icon: Network },
              { key: "growth", icon: TrendingUp },
              { key: "logistics", icon: Truck },
            ].map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="group relative flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{t(`franchise.why.items.${key}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`franchise.why.items.${key}.body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="franchise-form" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16">

        <div className="mb-8 text-center">
          <p className="text-lg font-semibold text-foreground md:text-xl">
            {t("franchise.formIntro")}
          </p>
        </div>

        <Card><CardContent className="p-5 md:p-8"><BusinessApplicationForm kind="franchise" /></CardContent></Card>
      </section>
    </SiteLayout>
  );
}
