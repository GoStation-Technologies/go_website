import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/site-layout";
import { FuelTicker } from "@/components/site/fuel-ticker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, TrendingUp, Building2, Star, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "GoStation — A station and more" },
      { name: "description", content: "The fastest-growing fuel network in Saudi Arabia — live fuel prices, franchise opportunities, and a full station experience." },
    ],
  }),
});

function HomePage() {
  const { t, i18n } = useTranslation();
  const lng = (i18n.language || "en").startsWith("ar") ? "ar" : "en";

  const news = useQuery({
    queryKey: ["home-news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, slug, title_ar, title_en, excerpt_ar, excerpt_en, cover_url, published_at")
        .eq("is_published", true).eq("kind", "news")
        .order("published_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  const reviews = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("system_cache").select("value").eq("key", "google_reviews").maybeSingle();
      return (data?.value as { reviews: Array<{ author: string; rating: number; text: string; lang: string }> })?.reviews ?? [];
    },
  });

  const stats = [
    { key: "statsStations", val: "180+" },
    { key: "statsRegions", val: "13" },
    { key: "statsYears", val: "12" },
    { key: "statsDaily", val: "50k+" },
  ] as const;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-brand-radial text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-20 pb-24 md:grid-cols-2 md:items-center md:pt-28 md:pb-32">
          <div>
            <Badge className="border-none bg-accent/20 text-accent hover:bg-accent/25">{t("home.heroBadge")}</Badge>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight md:text-6xl">{t("home.heroTitle")}</h1>
            <p className="mt-4 max-w-lg text-lg text-primary-foreground/80">{t("home.heroSub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/franchise">{t("home.ctaFranchise")} <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/stations">{t("home.ctaStations")}</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-accent/30 via-primary-foreground/5 to-transparent p-1 shadow-2xl">
              <div className="flex h-full items-center justify-center rounded-[calc(1.5rem-4px)] bg-primary/60 backdrop-blur">
                <div className="grid grid-cols-2 gap-6 p-8">
                  {stats.map((s) => (
                    <div key={s.key} className="text-center">
                      <div className="text-4xl font-extrabold text-accent">{s.val}</div>
                      <div className="mt-1 text-sm text-primary-foreground/70">{t(`home.${s.key}`)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FuelTicker />

      {/* Mobile stats */}
      <section className="border-b bg-muted/40 py-10 md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 text-center">
          {stats.map((s) => (
            <div key={s.key}>
              <div className="text-3xl font-extrabold text-primary">{s.val}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t(`home.${s.key}`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold md:text-4xl">{t("home.whyTitle")}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, k: "Customer", href: "/stations" },
            { icon: TrendingUp, k: "Investor", href: "/investors" },
            { icon: Building2, k: "Owner", href: "/franchise" },
          ].map(({ icon: Icon, k, href }) => (
            <Card key={k} className="group border-border/60 transition hover:border-accent hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{t(`home.why${k}`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`home.why${k}Text`)}</p>
                <Link to={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  {t("common.learnMore")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* News */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl font-bold md:text-4xl">{t("home.newsTitle")}</h2>
            <Link to="/media" className="text-sm font-medium text-accent hover:underline">{t("common.viewAll")}</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {(news.data ?? []).map((n) => (
              <Link key={n.id} to="/media/$slug" params={{ slug: n.slug }}>
                <Card className="h-full overflow-hidden transition hover:shadow-lg">
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary to-accent/60" />
                  <CardContent className="p-6">
                    <div className="text-xs text-muted-foreground">
                      {n.published_at ? new Date(n.published_at).toLocaleDateString(lng === "ar" ? "ar-SA" : "en-US") : ""}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold">{lng === "ar" ? n.title_ar : n.title_en}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{lng === "ar" ? n.excerpt_ar : n.excerpt_en}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold md:text-4xl">{t("home.reviewsTitle")}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {(reviews.data ?? []).slice(0, 3).map((r, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center gap-0.5 text-accent">
                  {Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-3 text-sm text-foreground/90">"{r.text}"</p>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent" />
                  <span className="font-medium">{r.author}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="overflow-hidden rounded-3xl bg-brand-radial px-8 py-12 text-primary-foreground md:px-16 md:py-16">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">{t("home.ctaBanner")}</h2>
              <p className="mt-2 max-w-xl text-primary-foreground/80">{t("home.ctaBannerText")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/franchise">{t("nav.franchise")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/acquisitions"><MapPin className="me-2 h-4 w-4" /> {t("nav.acquisitions")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
