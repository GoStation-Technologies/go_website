import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/media/news")({
  component: NewsArchivePage,
  head: () =>
    pageHead({
      path: "/media/news",
      title: "News Archive — GoStation",
      description:
        "Browse all GoStation news and press releases: network expansions, partnerships, announcements and company updates across Saudi Arabia.",
    }),
});

function NewsArchivePage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);

  const { data = [] } = useQuery({
    queryKey: ["media-news-archive"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("*")
        .eq("is_published", true)
        .eq("kind", "news")
        .order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(lng === "ar" ? "ar-EG-u-nu-latn" : "en-US", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-brand-radial py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <Link
            to="/media"
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("media.back")}
          </Link>
          <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
            {t("media.eyebrow")}
          </span>
          <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">{t("media.latestNews")}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        {data.length === 0 ? (
          <p className="text-muted-foreground">{t("media.empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((n) => (
              <Link key={n.id} to="/media/$slug" params={{ slug: n.slug }} className="group">
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
                    <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-snug">
                      {lng === "ar" ? n.title_ar : n.title_en}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {lng === "ar" ? n.excerpt_ar : n.excerpt_en}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
