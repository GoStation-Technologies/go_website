import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { MediaCarousel } from "@/components/site/media-carousel";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Play, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/media/")({
  component: MediaPage,
  head: () =>
    pageHead({
      path: "/media",
      title: "Media Center — GoStation News, Events & Video Library",
      description:
        "Latest GoStation news, press releases, events and video library across Saudi Arabia, plus media contacts for journalists.",
    }),
});

type Filter = "all" | "news" | "event" | "video";

function MediaPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const [filter, setFilter] = useState<Filter>("all");

  const { data = [] } = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  const news = data.filter((d) => d.kind === "news");
  const events = data.filter((d) => d.kind === "event");
  const videos = data.filter((d) => d.kind === "video");

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(lng === "ar" ? "ar-EG-u-nu-latn" : "en-US", { day: "numeric", month: "long", year: "numeric" }) : "";

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t("media.all"), count: data.length },
    { key: "news", label: t("media.news"), count: news.length },
    { key: "event", label: t("media.events"), count: events.length },
    { key: "video", label: t("media.videos"), count: videos.length },
  ];

  const show = (k: Filter) => filter === "all" || filter === k;

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-brand-radial py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
            {t("media.eyebrow")}
          </span>
          <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">{t("media.title")}</h1>
          <p className="mt-4 max-w-2xl text-white/70">{t("media.intro")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        {/* filter pills */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                filter === f.key
                  ? "bg-accent text-accent-foreground shadow-glow"
                  : "border border-border bg-background text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              {f.label}
              <span className="ms-2 text-xs opacity-70">{f.count}</span>
            </button>
          ))}
        </div>

        {data.length === 0 && <p className="mt-12 text-muted-foreground">{t("media.empty")}</p>}

        {/* news rail */}
        {show("news") && news.length > 0 && (
          <Section title={t("media.latestNews")}>
            <MediaCarousel>
              {news.map((n) => (
                <Link
                  key={n.id}
                  to="/media/$slug"
                  params={{ slug: n.slug }}
                  className="group w-[300px] shrink-0 snap-start sm:w-[340px]"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {n.cover_url ? (
                        <img
                          src={n.cover_url}
                          alt={lng === "ar" ? n.title_ar : n.title_en}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary to-accent/60" />
                      )}
                      <Badge className="absolute start-3 top-3 bg-accent text-accent-foreground">
                        {t("media.news")}
                      </Badge>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="text-xs text-muted-foreground">{fmt(n.published_at)}</div>
                      <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug">
                        {lng === "ar" ? n.title_ar : n.title_en}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {lng === "ar" ? n.excerpt_ar : n.excerpt_en}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* events rail */}
        {show("event") && events.length > 0 && (
          <Section title={t("media.upcomingEvents")}>
            <MediaCarousel step={440}>
              {events.map((e) => (
                <Link
                  key={e.id}
                  to="/media/$slug"
                  params={{ slug: e.slug }}
                  className="group w-[320px] shrink-0 snap-start sm:w-[420px]"
                >
                  <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl">
                    <Badge variant="outline" className="w-fit border-accent/40 text-accent">
                      {t("media.events")}
                    </Badge>
                    <h3 className="mt-3 text-xl font-bold leading-snug">
                      {lng === "ar" ? e.title_ar : e.title_en}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {e.event_date && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {fmt(e.event_date)}
                        </span>
                      )}
                      {(e.event_location_ar || e.event_location_en) && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {lng === "ar" ? e.event_location_ar : e.event_location_en}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm">{lng === "ar" ? e.excerpt_ar : e.excerpt_en}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-accent">
                      {t("media.readMore")}
                      <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
                    </span>
                  </article>
                </Link>
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* video library */}
        {show("video") && videos.length > 0 && (
          <Section title={t("media.videoLibrary")}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </Section>
        )}


        {show("video") && videos.length === 0 && filter === "video" && (
          <p className="mt-12 text-muted-foreground">{t("media.empty")}</p>
        )}
      </section>
    </SiteLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold md:text-3xl">{title}</h2>
        <span className="hidden h-px flex-1 bg-border sm:block" />
      </div>
      {children}
    </div>
  );
}
