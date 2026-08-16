import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { StoryTimeline } from "@/components/site/story-timeline";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Eye, Target, Sparkles, Leaf, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () =>
    pageHead({
      path: "/about",
      title: "About GoStation — Our Story, Vision & ESG",
      description:
        "Meet GoStation: our story, vision and mission, leadership team, values and ESG commitments behind Saudi Arabia's fastest-growing fuel network.",
    }),
});

function AboutPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);

  const pages = useQuery({
    queryKey: ["about-pages"],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("block_key, content_ar, content_en").eq("page_key", "about");
      const map = new Map<string, { ar: string; en: string }>();
      (data ?? []).forEach((r) => map.set(r.block_key, { ar: r.content_ar ?? "", en: r.content_en ?? "" }));
      return map;
    },
  });

  const leaders = useQuery({
    queryKey: ["leaders"],
    queryFn: async () => {
      const { data } = await supabase.from("leaders").select("*").eq("is_active", true).order("sort_order");
      return data ?? [];
    },
  });

  const awards = useQuery({
    queryKey: ["awards"],
    queryFn: async () => {
      const { data } = await supabase.from("awards").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const get = (k: string) => (pages.data?.get(k)?.[lng] ?? "");

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("about.title")}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{get("story_body")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <Tabs defaultValue="story">
          <TabsList className="flex flex-wrap justify-center">
            <TabsTrigger value="story">{t("about.story")}</TabsTrigger>
            <TabsTrigger value="vision">{t("about.vision")}</TabsTrigger>
            <TabsTrigger value="mission">{t("about.mission")}</TabsTrigger>
            <TabsTrigger value="values">{t("about.values")}</TabsTrigger>
            <TabsTrigger value="esg">{t("about.esg")}</TabsTrigger>
            <TabsTrigger value="leaders">{t("about.leaders")}</TabsTrigger>
            <TabsTrigger value="awards">{t("about.awards")}</TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="mt-8 space-y-10">
            <Card><CardContent className="prose max-w-none p-8"><h2 className="mb-3 text-2xl font-bold">{get("story_title")}</h2><p>{get("story_body")}</p></CardContent></Card>
            <StoryTimeline />
          </TabsContent>

          <TabsContent value="vision" className="mt-8">
            <IconBlock icon={Eye} title={t("about.vision")} body={get("vision")} />
          </TabsContent>
          <TabsContent value="mission" className="mt-8">
            <IconBlock icon={Target} title={t("about.mission")} body={get("mission")} />
          </TabsContent>
          <TabsContent value="values" className="mt-8">
            <IconBlock icon={Sparkles} title={t("about.values")} body={get("values")} />
          </TabsContent>
          <TabsContent value="esg" className="mt-8">
            <IconBlock icon={Leaf} title={t("about.esg")} body={get("esg")} />
          </TabsContent>

          <TabsContent value="leaders" className="mt-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(leaders.data ?? []).map((l) => (
                <Card key={l.id}>
                  <div className="aspect-square bg-gradient-to-br from-primary to-accent/60" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-primary"><Users className="h-4 w-4" /></div>
                    <h3 className="mt-1 font-bold">{lng === "ar" ? l.name_ar : l.name_en}</h3>
                    <p className="text-sm text-accent">{lng === "ar" ? l.title_ar : l.title_en}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{lng === "ar" ? l.bio_ar : l.bio_en}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="awards" className="mt-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(awards.data ?? []).map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-6">
                    <Award className="h-8 w-8 text-accent" />
                    <h3 className="mt-3 font-bold">{lng === "ar" ? a.name_ar : a.name_en}</h3>
                    <p className="text-sm text-muted-foreground">{lng === "ar" ? a.issuer_ar : a.issuer_en} · {a.year}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}

function IconBlock({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
