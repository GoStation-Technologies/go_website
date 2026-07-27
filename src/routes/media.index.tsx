import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/media/")({
  component: MediaPage,
  head: () =>
    pageHead({
      path: "/media",
      title: "Media Center — GoStation News & Press Releases",
      description:
        "Latest GoStation news, press releases, network expansion announcements and events across Saudi Arabia, plus media contacts for journalists.",
    }),
});

function MediaPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const { data = [] } = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data } = await supabase.from("news_articles").select("*").eq("is_published", true).order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  const news = data.filter((d) => d.kind === "news");
  const events = data.filter((d) => d.kind === "event");

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("media.title")}</h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <Tabs defaultValue="news">
          <TabsList>
            <TabsTrigger value="news">{t("media.news")}</TabsTrigger>
            <TabsTrigger value="events">{t("media.events")}</TabsTrigger>
          </TabsList>
          <TabsContent value="news" className="mt-8">
            {news.length === 0 ? <p className="text-muted-foreground">{t("media.empty")}</p> : (
              <div className="grid gap-6 md:grid-cols-3">
                {news.map((n) => (
                  <Link key={n.id} to="/media/$slug" params={{ slug: n.slug }}>
                    <Card className="h-full overflow-hidden transition hover:shadow-lg">
                      <div className="aspect-[16/9] bg-gradient-to-br from-primary to-accent/60" />
                      <CardContent className="p-6">
                        {n.is_featured && <Badge className="mb-2 bg-accent text-accent-foreground">Featured</Badge>}
                        <div className="text-xs text-muted-foreground">{n.published_at ? new Date(n.published_at).toLocaleDateString(lng === "ar" ? "ar-SA" : "en-US") : ""}</div>
                        <h3 className="mt-2 line-clamp-2 text-lg font-semibold">{lng === "ar" ? n.title_ar : n.title_en}</h3>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{lng === "ar" ? n.excerpt_ar : n.excerpt_en}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="events" className="mt-8">
            {events.length === 0 ? <p className="text-muted-foreground">{t("media.empty")}</p> : (
              <div className="grid gap-6 md:grid-cols-2">
                {events.map((e) => (
                  <Link key={e.id} to="/media/$slug" params={{ slug: e.slug }}>
                    <Card className="transition hover:shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold">{lng === "ar" ? e.title_ar : e.title_en}</h3>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {e.event_date && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(e.event_date).toLocaleDateString(lng === "ar" ? "ar-SA" : "en-US")}</span>}
                          {(e.event_location_ar || e.event_location_en) && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{lng === "ar" ? e.event_location_ar : e.event_location_en}</span>}
                        </div>
                        <p className="mt-3 text-sm">{lng === "ar" ? e.excerpt_ar : e.excerpt_en}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
