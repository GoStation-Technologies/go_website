import { BusinessApplicationForm } from "@/components/site/business-application-form";
import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useTranslation } from "react-i18next";
import { usePageContent } from "@/hooks/use-cms";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Clock, FileText, Handshake } from "lucide-react";
const stationImg = { url: "/station-canopy.jpg" };

export const Route = createFileRoute("/acquisitions")({
  component: AcqPage,
  head: () =>
    pageHead({
      path: "/acquisitions",
      title: "Sell Your Station — GoStation Acquisitions",
      description:
        "GoStation acquires existing fuel stations across Saudi Arabia. Share your station details and our acquisitions team will evaluate and respond.",
    }),
});

function AcqPage() {
  const { t } = useTranslation();
  const cms = usePageContent("acquisitions");
  const facts = [
    { icon: Info, title: t("acq.facts.valuation"), body: t("acq.facts.valuationBody") },
    { icon: Clock, title: t("acq.facts.timeline"), body: t("acq.facts.timelineBody") },
    { icon: FileText, title: t("acq.facts.docs"), body: t("acq.facts.docsBody") },
  ];

  return (
    <SiteLayout>
      {/* Intro band */}
      <section className="relative isolate overflow-hidden border-b bg-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            background:
              "radial-gradient(600px 300px at 8% 0%, var(--primary), transparent 65%), radial-gradient(500px 260px at 95% 100%, var(--accent), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            <Handshake className="h-3.5 w-3.5" />
            {t("acq.eyebrow")}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-primary md:text-4xl">{cms.field("hero", "title", t("acq.title"))}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">{cms.field("hero", "subtitle", t("acq.lead"))}</p>
        </div>
      </section>

      {/* Two-column: details + inline form */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* Details */}
          <Card className="overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-bold">{cms.field("criteria", "title", t("acq.detailsTitle"))}</h2>
              <div className="mt-4 overflow-hidden rounded-xl">
                <img
                  src={stationImg.url}
                  alt={t("acq.title")}
                  loading="lazy"
                  className="h-56 w-full object-cover md:h-64"
                />
              </div>

              <h3 className="mt-6 text-base font-bold">{t("acq.title")}</h3>
              <ul className="mt-3 grid gap-3">
                {facts.map(({ icon: Icon, title, body }) => (
                  <li
                    key={title}
                    className="flex items-start gap-3 rounded-xl border-b-2 border-b-primary bg-muted/40 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm leading-relaxed">
                      <span className="font-semibold">{title}</span>{" "}
                      <span className="text-muted-foreground">{body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="mb-6 text-lg font-bold">{t("acq.formTitle")}</h2>
              <BusinessApplicationForm kind="acquisition" />
            </CardContent>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}
