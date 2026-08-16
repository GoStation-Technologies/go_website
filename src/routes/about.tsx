import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { StoryTimeline } from "@/components/site/story-timeline";
import { FutureRoadmap } from "@/components/site/future-roadmap";
import canopyImg from "@/assets/station-canopy.jpg.asset.json";


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Eye, Target, Sparkles, Leaf, Users, Quote, ShieldCheck, Handshake } from "lucide-react";

const aboutValues = [
  { icon: Sparkles, k: "excellence" },
  { icon: ShieldCheck, k: "integrity" },
  { icon: Leaf, k: "community" },
  { icon: Handshake, k: "innovation" },
] as const;

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
      <section className="relative overflow-hidden bg-primary py-20 text-white">
        {/* Cropped canopy detail, sitting under a full navy filter */}
        <div className="pointer-events-none absolute inset-y-0 end-0 hidden w-[62%] overflow-hidden md:block">
          <img
            src={canopyImg.url}
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
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("about.title")}</h1>
          <p className="mt-4 max-w-2xl text-white/80 md:max-w-xl">{get("story_body")}</p>
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
            <TabsTrigger value="governance">{t("about.governance")}</TabsTrigger>
            <TabsTrigger value="leaders">{t("about.leaders")}</TabsTrigger>
            <TabsTrigger value="awards">{t("about.awards")}</TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="mt-8 space-y-10">
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold text-accent">{t("about.founding.title")}</h2>
              </div>
              <CardContent className="p-8">
                <p className="max-w-4xl leading-relaxed text-muted-foreground">{t("about.founding.body")}</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold text-accent">{t("about.activities.title")}</h2>
              </div>
              <CardContent className="p-8">
                <p className="font-semibold">{t("about.activities.lead")}</p>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(t("about.activities.items", { returnObjects: true }) as string[]).map((item, i) => (
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
            <IconBlock icon={Eye} title={t("about.vision")} body={get("vision")} />
          </TabsContent>
          <TabsContent value="mission" className="mt-8">
            <IconBlock icon={Target} title={t("about.mission")} body={get("mission")} />
          </TabsContent>
          <TabsContent value="values" className="mt-8">
            <Card>
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold">{t("about.values")}</h2>
              </div>
              <CardContent className="p-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {aboutValues.map(({ icon: Icon, k }) => (
                    <div key={k} className="flex flex-col">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold">{t(`home.values.${k}.title`)}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{t(`home.values.${k}.body`)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="esg" className="mt-8 space-y-8">
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold">{t("about.esg")}</h2>
              </div>
              <CardContent className="p-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                  <Leaf className="h-4 w-4" />
                  {t("about.sustain.eyebrow")}
                </span>
                <h3 className="mt-5 text-balance font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                  {t("about.sustain.title")}
                </h3>
                <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                  <p>{t("about.sustain.body")}</p>
                  <p>{t("about.sustain.body2")}</p>
                  <p>{t("about.sustain.body3")}</p>
                  {get("esg") ? <p>{get("esg")}</p> : null}
                </div>

                <h4 className="mt-8 font-display text-lg font-bold">{t("about.sustain.pillarsTitle")}</h4>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {([
                    { k: "env", icon: Leaf },
                    { k: "social", icon: Users },
                  ] as const).map(({ k, icon: Icon }) => (
                    <div key={k} className="rounded-2xl border bg-card p-6 transition-colors hover:border-accent/50">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h5 className="mt-4 font-display text-lg font-bold">{t(`about.sustain.pillars.${k}.title`)}</h5>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t(`about.sustain.pillars.${k}.body`)}
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
                <h2 className="font-display text-xl font-bold text-accent">{t("about.sustain.envLabel")}</h2>
              </div>
              <CardContent className="grid gap-10 p-8 lg:grid-cols-2">
                <div>
                  <p className="font-display text-xl font-bold text-accent">“{t("about.sustain.envQuote")}”</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{t("about.sustain.envIntro")}</p>
                  <div className="mt-6 rounded-2xl border bg-muted/40 p-6">
                    <h4 className="font-display text-lg font-bold">{t("about.sustain.envGoalTitle")}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("about.sustain.envGoalBody")}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-display text-xl font-bold">{t("about.sustain.envAxesTitle")}</h4>
                  <ol className="mt-5 space-y-4">
                    {["envA1", "envA2", "envA3"].map((k, i) => (
                      <li
                        key={k}
                        className="flex items-start gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-accent/50"
                      >
                        <span className="font-display text-lg font-extrabold text-accent tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">{t(`about.sustain.${k}`)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-8 py-4">
                <h2 className="font-display text-xl font-bold text-accent">{t("about.sustain.socLabel")}</h2>
              </div>
              <CardContent className="grid gap-10 p-8 lg:grid-cols-2">
                <div>
                  <p className="font-display text-xl font-bold text-accent">“{t("about.sustain.socQuote")}”</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{t("about.sustain.socIntro")}</p>
                  <div className="mt-6 rounded-2xl border bg-muted/40 p-6">
                    <h4 className="font-display text-lg font-bold">{t("about.sustain.socGoalTitle")}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("about.sustain.socGoalBody")}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-display text-xl font-bold">{t("about.sustain.socAxesTitle")}</h4>
                  <ol className="mt-5 space-y-4">
                    {["socA1", "socA2", "socA3"].map((k, i) => (
                      <li
                        key={k}
                        className="flex items-start gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-accent/50"
                      >
                        <span className="font-display text-lg font-extrabold text-accent tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">{t(`about.sustain.${k}`)}</span>
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
                <h2 className="font-display text-xl font-bold">{t("about.governance")}</h2>
              </div>
              <CardContent className="grid gap-10 p-8 lg:grid-cols-2">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                    <ShieldCheck className="h-4 w-4" />
                    {t("investors.govEyebrow")}
                  </span>
                  <h3 className="mt-5 text-balance font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                    {t("investors.govTitle")}
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{t("investors.govBody")}</p>
                  <div className="mt-6 rounded-2xl border bg-muted/40 p-6">
                    <h4 className="font-display text-lg font-bold">{t("investors.govGoalTitle")}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("investors.govGoalBody")}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-xl font-bold">{t("investors.govPillarsTitle")}</h4>
                  <ol className="mt-5 space-y-4">
                    {["govP1", "govP2", "govP3"].map((k, i) => (
                      <li key={k} className="flex items-start gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-accent/50">
                        <span className="font-display text-lg font-extrabold text-accent tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">{t(`investors.${k}`)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaders" className="mt-8 space-y-8">
            {(() => {
              const all = (leaders.data ?? []) as Leader[];
              const chairman = all.find(
                (l) =>
                  l.title_en?.toLowerCase().includes("chairman") ||
                  l.title_ar?.includes("رئيس مجلس"),
              );
              const team = chairman ? all.filter((l) => l.id !== chairman.id) : all;
              return (
                <>
                  {chairman && <ChairmanCard leader={chairman} lng={lng} />}
                  <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {team.map((l) => (
                      <LeadershipCard key={l.id} leader={l} lng={lng} />
                    ))}
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

type Leader = Database["public"]["Tables"]["leaders"]["Row"];

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

function ChairmanCard({ leader, lng }: { leader: Leader; lng: "ar" | "en" }) {
  const { t } = useTranslation();
  const name = lng === "ar" ? leader.name_ar : leader.name_en;
  const title = lng === "ar" ? leader.title_ar : leader.title_en;
  const openQuote = lng === "ar" ? "«" : "“";
  const closeQuote = lng === "ar" ? "»" : "”";

  return (
    <Card className="overflow-hidden border-0 shadow-2xl">
      <div className="relative flex min-h-[360px] flex-col-reverse items-stretch overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent/40 md:flex-row">
        {/* ambient light */}
        <div className="absolute -start-10 -top-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -end-10 -bottom-10 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary-foreground/10 via-transparent to-transparent opacity-40" />

        {/* Quote / text side */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-8 md:px-10 md:py-12 lg:px-14">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Quote className="h-5 w-5" />
          </div>
          <blockquote className="relative">
            <p className="text-2xl font-semibold leading-relaxed text-primary-foreground md:text-3xl lg:text-4xl">
              <span className="text-accent/80">{openQuote}</span>
              {t("home.quote")}
              <span className="text-accent/80">{closeQuote}</span>
            </p>
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-accent/30 bg-primary-foreground/10">
              {leader.photo_url ? (
                <img src={leader.photo_url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-primary-foreground/40">
                  <Users className="h-6 w-6" />
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-primary-foreground">{name}</p>
              <p className="text-sm font-medium text-accent">{title}</p>
            </div>
          </div>
        </div>

        {/* Image side */}
        <div className="relative z-10 flex w-full items-end justify-center md:w-5/12 lg:w-1/3">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent opacity-60" />
          {leader.photo_url ? (
            <img
              src={leader.photo_url}
              alt={name}
              className="relative z-10 max-h-80 w-auto object-contain drop-shadow-2xl md:max-h-[420px]"
            />
          ) : (
            <div className="aspect-[3/4] w-full max-w-sm rounded-t-2xl bg-gradient-to-br from-primary-foreground/20 to-transparent" />
          )}
        </div>
      </div>
    </Card>
  );
}

function LeadershipCard({ leader, lng }: { leader: Leader; lng: "ar" | "en" }) {
  const name = lng === "ar" ? leader.name_ar : leader.name_en;
  const title = lng === "ar" ? leader.title_ar : leader.title_en;
  const bio = lng === "ar" ? leader.bio_ar : leader.bio_en;
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent/40">
        {leader.photo_url ? (
          <img
            src={leader.photo_url}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Users className="h-16 w-16 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent" />
      </div>
      <CardContent className="p-5">
        <h3 className="text-lg font-bold leading-tight">{name}</h3>
        <p className="mt-1 text-sm font-medium text-accent">{title}</p>
        <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{bio}</p>
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
