import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitAcquisitionRequest } from "@/lib/submissions.functions";
import { SiteLayout } from "@/components/site/site-layout";
import { CitySelect } from "@/components/site/city-select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Building2, Info, Clock, FileText, Handshake } from "lucide-react";
import stationImg from "@/assets/station-canopy.jpg.asset.json";

export const Route = createFileRoute("/acquisitions")({
  component: AcqPage,
  head: () =>
    pageHead({
      path: "/acquisitions",
      title: "الاستحواذ",
      description:
        "GoStation acquires existing fuel stations across Saudi Arabia. Share your station details and our acquisitions team will evaluate and respond.",
    }),
});

function AcqPage() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [city, setCity] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await submitAcquisitionRequest({
        data: {
          full_name: String(fd.get("name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          email: String(fd.get("email") ?? ""),
          station_name: String(fd.get("station") ?? ""),
          city,
          district: String(fd.get("district") ?? ""),
          land_area_sqm: String(fd.get("area") ?? ""),
          fuel_pumps_count: String(fd.get("pumps") ?? ""),
          avg_daily_sales_sar: String(fd.get("sales") ?? ""),
          notes: String(fd.get("notes") ?? ""),
        },
      });
      setRef(res.reference);
      toast.success(t("common.thanks"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

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
          <h1 className="mt-4 text-3xl font-extrabold text-primary md:text-4xl">{t("acq.title")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">{t("acq.lead")}</p>
        </div>
      </section>

      {/* Two-column: details + inline form */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* Details */}
          <Card className="overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-bold">{t("acq.detailsTitle")}</h2>
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
              {ref ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
                  <h2 className="mt-4 text-2xl font-bold">{t("common.thanks")}</h2>
                  <p className="mt-2 text-muted-foreground">
                    {t("common.referenceSaved")} <span className="font-mono">{ref}</span>
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Building2 className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold">{t("acq.formTitle")}</h2>
                      <p className="text-sm text-muted-foreground">{t("acq.formSub")}</p>
                    </div>
                  </div>

                  <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                    <F label={t("common.fullName")}><Input name="name" required /></F>
                    <F label={t("common.phone")}><Input name="phone" required /></F>
                    <F label={t("common.email")} className="sm:col-span-2"><Input type="email" name="email" required /></F>
                    <F label={t("acq.f.stationName")}><Input name="station" /></F>
                    <F label={t("common.city")}><CitySelect value={city} onChange={setCity} /></F>
                    <F label={t("acq.f.district")}><Input name="district" /></F>
                    <F label={t("acq.f.landArea")}><Input type="number" name="area" /></F>
                    <F label={t("acq.f.pumps")}><Input type="number" name="pumps" /></F>
                    <F label={t("acq.f.avgSales")}><Input type="number" name="sales" /></F>
                    <F label={t("common.message")} className="sm:col-span-2"><Textarea rows={4} name="notes" /></F>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        {busy ? t("common.submitting") : t("acq.submitCta")}
                      </Button>
                      <Button type="reset" variant="outline" disabled={busy}>
                        {t("acq.cancel")}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}

function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={"grid gap-1.5 " + className}><Label>{label}</Label>{children}</div>;
}
