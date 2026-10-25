import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useTranslation } from "react-i18next";
import { useCompanyValues, usePageContent } from "@/hooks/use-cms";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { StoryTimeline } from "@/components/site/story-timeline";
import { FutureRoadmap } from "@/components/site/future-roadmap";
import { ManagementProfile } from "@/components/site/management-profile";
import { LeadershipStatement, StatementPair } from "@/components/site/leadership-statement";
import { managementTeam } from "@/lib/management-team";
const canopyImg = { url: "/station-canopy.jpg" };


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Eye, Target, Sparkles, Leaf, Users, ShieldCheck, Handshake } from "lucide-react";

const valueIcons = { excellence: Sparkles, integrity: ShieldCheck, community: Leaf, innovation: Handshake } as const;

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
  const cms = usePageContent("about");
  const homeCms = usePageContent("home");
  const aboutValues = useCompanyValues();
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
    queryKey: ["cms", "leaders"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase.from("leaders").select("*").eq("is_active", true).order("sort_order");
      return data ?? [];
    },
  });

  const awards = useQuery({
    queryKey: ["awards"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await supabase.from("awards").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const get = (k: string) => (pages.data?.get(k)?.[lng] ?? "");

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-primary py-20 text-white">
        {/* Cropped canopy detail, sitting under a full navy filter */}
        <div className="pointer-events-none absolute inset-y-0 end-0 hidden w-[62%] overflow-hidden md:block">
          <img
            src={cms.media("hero", canopyImg.url)}
            alt={lng === "ar" ? "مظلة محطة قوستيشن" : "GoStation station canopy"}
            className="h-full w-full scale-125 object-cover object-[50%_38%] opacity-45"
            style={{
              WebkitMaskImage: `linear-gradient(to ${lng === "ar" ? "left" : "right"}, transparent 0%, rgba(0,0,0,0.6) 40%, black 80%)`,
              maskImage: `linear-gradient(to ${lng === "ar" ? "left" : "right"}, transparent 0%, rgba(0,0,0,0.6) 40%, black 80%)`,
            }}
            loading="eager"
          />
        </div>
        {/* full-banner brand filter over everything */}
        <div className="pointer-events-none absolute inset-0 bg-brand-radial opacity-80 mix-blend-multiply" />
        <div className="pointer-events-none absolute inset-0 bg-primary/35" />



        <div className="relative z-10 mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{cms.field("hero", "title", t("about.title"))}</h1>
          <p className="mt-4 max-w-2xl text-white/80 md:max-w-xl">{cms.field("hero", "content", get("story_body"))}</p>
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-4 py-16">
        <Tabs defaultValue="story">
          <TabsList className="flex flex-wrap justify-center">
            <TabsTrigger value="story">{t("about.story")}</TabsTrigger>
            <TabsTrigger value="vision">{cms.field("vision", "title", t("about.vision"))}</TabsTrigger>
            <TabsTrigger value="mission">{cms.field("mission", "title", t("about.mission"))}</TabsTrigger>
            <TabsTrigger value="values">{cms.field("values", "title", t("about.values"))}</TabsTrigger>
            <TabsTrigger value="esg">{cms.field("esg", "title", t("about.esg"))}</TabsTrigger>
            <TabsTrigger value="governance">{cms.field("governance", "title", t("about.governance"))}</TabsTrigger>
            <TabsTrigger value="leaders">{cms.field("leadership", "title", t("about.leaders"))}</TabsTrigger>
            <TabsTrigger value="awards">{t("about.awards")}</TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="mt-8 space-y-10">
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold text-accent">{cms.field("story", "title", t("about.founding.title"))}</h2>
              </div>
              <CardContent className="p-8">
                <p className="max-w-4xl whitespace-pre-line leading-relaxed text-muted-foreground">{cms.field("story", "content", t("about.founding.body"))}</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold text-accent">{cms.field("activities", "title", t("about.activities.title"))}</h2>
              </div>
              <CardContent className="p-8">
                <p className="font-semibold">{cms.field("activities", "subtitle", t("about.activities.lead"))}</p>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(cms.field("activities", "content", "").split("\n").map((x) => x.trim()).filter(Boolean).length
                    ? cms.field("activities", "content", "").split("\n").map((x) => x.trim()).filter(Boolean)
                    : (t("about.activities.items", { returnObjects: true }) as string[])).map((item, i) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-accent/40"
                    >
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-display text-xs font-extrabold text-accent tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>


            <StoryTimeline />

            <FutureRoadmap />
          </TabsContent>


          <TabsContent value="vision" className="mt-8">
            <IconBlock icon={Eye} title={cms.field("vision", "title", t("about.vision"))} body={cms.field("vision", "content", get("vision"))} />
          </TabsContent>
          <TabsContent value="mission" className="mt-8">
            <IconBlock icon={Target} title={cms.field("mission", "title", t("about.mission"))} body={cms.field("mission", "content", get("mission"))} />
          </TabsContent>
          <TabsContent value="values" className="mt-8">
            <Card>
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold">{cms.field("values", "title", t("about.values"))}</h2>
              </div>
              <CardContent className="p-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {aboutValues.map(({ k, title, body }) => {
                    const Icon = valueIcons[k];
                    return (
                    <div key={k} className="flex flex-col rounded-xl border bg-card p-6">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="esg" className="mt-8 space-y-8">
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold">{cms.field("esg", "title", t("about.esg"))}</h2>
              </div>
              <CardContent className="p-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                  <Leaf className="h-4 w-4" />
                  {cms.field("esg", "subtitle", t("about.sustain.eyebrow"))}
                </span>
                <h3 className="mt-5 text-balance font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                  {cms.field("esg", "title", t("about.sustain.title"))}
                </h3>
                <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                  {(cms.field("esg", "content", "")
                    ? cms.field("esg", "content", "").split(/\n\s*\n/)
                    : [t("about.sustain.body"), t("about.sustain.body2"), t("about.sustain.body3"), get("esg")]
                  ).filter((x) => x && x.trim()).map((para, i) => (
                    <p key={i} className="whitespace-pre-line">{para}</p>
                  ))}
                </div>

                <h4 className="mt-8 font-display text-lg font-bold">{t("about.sustain.pillarsTitle")}</h4>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  {([
                    { k: "env", icon: Leaf, s: "esg_env" },
                    { k: "social", icon: Users, s: "esg_social" },
                    { k: "gov", icon: ShieldCheck, s: "esg_gov" },
                  ] as const).filter(({ s }) => cms.visible(s)).map(({ k, icon: Icon, s }) => (
                    <div key={k} className="rounded-2xl border bg-card p-6 transition-colors hover:border-accent/50">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h5 className="mt-4 font-display text-lg font-bold">{cms.field(s, "title", t(`about.sustain.pillars.${k}.title`))}</h5>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {cms.field(s, "content", t(`about.sustain.pillars.${k}.body`))}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 rounded-2xl border bg-muted/40 p-6 text-sm leading-relaxed text-muted-foreground">
                  {t("about.sustain.note")}
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold text-accent">{cms.field("esg_env_detail", "title", t("about.sustain.envLabel"))}</h2>
              </div>
              <CardContent className="grid gap-10 p-8 lg:grid-cols-2">
                <div>
                  <p className="font-display text-xl font-bold text-accent">“{cms.field("esg_env_detail", "subtitle", t("about.sustain.envQuote"))}”</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{t("about.sustain.envIntro")}</p>
                  <div className="mt-6 rounded-2xl border bg-muted/40 p-6">
                    <h4 className="font-display text-lg font-bold">{t("about.sustain.envGoalTitle")}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("about.sustain.envGoalBody")}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-display text-xl font-bold">{t("about.sustain.envAxesTitle")}</h4>
                  <ol className="mt-5 space-y-4">
                    {(cms.field("esg_env_detail", "content", "").split("\n").map((x) => x.trim()).filter(Boolean).length
                      ? cms.field("esg_env_detail", "content", "").split("\n").map((x) => x.trim()).filter(Boolean)
                      : ["envA1", "envA2", "envA3"].map((k) => t(`about.sustain.${k}`))
                    ).map((text, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-accent/50"
                      >
                        <span className="font-display text-lg font-extrabold text-accent tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">{text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold text-accent">{cms.field("esg_soc_detail", "title", t("about.sustain.socLabel"))}</h2>
              </div>
              <CardContent className="grid gap-10 p-8 lg:grid-cols-2">
                <div>
                  <p className="font-display text-xl font-bold text-accent">“{cms.field("esg_soc_detail", "subtitle", t("about.sustain.socQuote"))}”</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{t("about.sustain.socIntro")}</p>
                  <div className="mt-6 rounded-2xl border bg-muted/40 p-6">
                    <h4 className="font-display text-lg font-bold">{t("about.sustain.socGoalTitle")}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("about.sustain.socGoalBody")}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-display text-xl font-bold">{t("about.sustain.socAxesTitle")}</h4>
                  <ol className="mt-5 space-y-4">
                    {(cms.field("esg_soc_detail", "content", "").split("\n").map((x) => x.trim()).filter(Boolean).length
                      ? cms.field("esg_soc_detail", "content", "").split("\n").map((x) => x.trim()).filter(Boolean)
                      : ["socA1", "socA2", "socA3"].map((k) => t(`about.sustain.${k}`))
                    ).map((text, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-accent/50"
                      >
                        <span className="font-display text-lg font-extrabold text-accent tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">{text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>




          <TabsContent value="governance" className="mt-8">
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold">{cms.field("governance", "title", t("about.governance"))}</h2>
              </div>
              <CardContent className="grid gap-10 p-8 lg:grid-cols-2">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                    <ShieldCheck className="h-4 w-4" />
                    {cms.field("governance", "subtitle", t("investors.govEyebrow"))}
                  </span>
                  <h3 className="mt-5 text-balance font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                    {cms.field("governance", "title", t("investors.govTitle"))}
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {cms.field("governance", "content", t("investors.govBody"))}
                  </p>
                  <div className="mt-6 rounded-2xl border bg-muted/40 p-6">
                    <h4 className="font-display text-lg font-bold">{cms.field("gov_goal", "title", t("investors.govGoalTitle"))}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {cms.field("gov_goal", "content", t("investors.govGoalBody"))}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-xl font-bold">{cms.field("gov_pillars", "title", t("investors.govPillarsTitle"))}</h4>
                  <ol className="mt-5 space-y-4">
                    {(cms.field("gov_pillars", "content", "").split("\n").map((x) => x.trim()).filter(Boolean).length
                      ? cms.field("gov_pillars", "content", "").split("\n").map((x) => x.trim()).filter(Boolean)
                      : ["govP1", "govP2", "govP3"].map((k) => t(`investors.${k}`))
                    ).map((text, i) => (
                      <li key={i} className="flex items-start gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-accent/50">
                        <span className="font-display text-lg font-extrabold text-accent tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">{text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaders" className="mt-10 space-y-12" dir={lng === "ar" ? "rtl" : "ltr"}>
            {(() => {
              const { chairman, ceo, executives } = managementTeam(leaders.data ?? []);
              return (
                <>
                  <div>
                    <h2 className="mb-6 font-display text-2xl font-bold">{t("about.leaders")}</h2>
                    <StatementPair>
                      {chairman && cms.visible("chairman") && (
                        <LeadershipStatement name={lng === "ar" ? chairman.name_ar : chairman.name_en} role={lng === "ar" ? chairman.title_ar : chairman.title_en}
                          photo={cms.media("chairman", chairman.photo_url ?? "")}
                          quote={cms.field("chairman", "content", homeCms.field("chairman", "content", t("home.chairmanQuote")))} />
                      )}
                      {ceo && cms.visible("ceo") && (
                        <LeadershipStatement name={lng === "ar" ? ceo.name_ar : ceo.name_en} role={lng === "ar" ? ceo.title_ar : ceo.title_en}
                          photo={cms.media("ceo", ceo.photo_url ?? "")}
                          quote={cms.field("ceo", "content", cms.field("leadership", "content", lng === "ar" ? ceo.bio_ar ?? "" : ceo.bio_en ?? ""))} />
                      )}
                    </StatementPair>
                  </div>
                  <div className="border-t border-border pt-10">
                    <h2 className="mb-6 font-display text-2xl font-bold">{lng === "ar" ? "فريق الإدارة التنفيذية" : "Executive Management Team"}</h2>
                    <div className="grid items-stretch gap-6 md:grid-cols-3">
                      {executives.map((leader) => <ManagementProfile key={leader.id} leader={leader} language={lng} />)}
                    </div>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="awards" className="mt-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(awards.data ?? []).map((a) => (
                <AwardCard key={a.id} award={a} lng={lng} />
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
        <p className="mt-2 whitespace-pre-line text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

type AwardRow = Database["public"]["Tables"]["awards"]["Row"];

function AwardCard({ award: a, lng }: { award: AwardRow; lng: "ar" | "en" }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const title = lng === "ar" ? a.name_ar : a.name_en;
  const issuer = lng === "ar" ? a.issuer_ar : a.issuer_en;

  return (
    <>
      <Card className="group relative transition-shadow hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <Award className="h-8 w-8 text-accent" />
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("about.viewAward")}
              title={t("about.viewAward")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
          <h3 className="mt-3 font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{issuer} · {a.year}</p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-start">{title}</DialogTitle>
            <DialogDescription className="text-start">{issuer} · {a.year}</DialogDescription>
          </DialogHeader>
          {a.image_url ? (
            <img
              src={a.image_url}
              alt={title ?? ""}
              className="max-h-[70vh] w-full rounded-xl border border-border object-contain bg-muted/30"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <Award className="h-12 w-12 text-accent" />
              <p className="text-sm text-muted-foreground">{t("about.awardNoImage")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
