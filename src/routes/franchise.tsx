import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitFranchiseApplication } from "@/lib/submissions.functions";
import { SiteLayout } from "@/components/site/site-layout";
import { CitySelect } from "@/components/site/city-select";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/franchise")({
  component: FranchisePage,
  head: () =>
    pageHead({
      path: "/franchise",
      title: "Own a GoStation Franchise — Apply Online",
      description:
        "Partner with GoStation and operate your own fuel station in Saudi Arabia. Review the requirements and submit your franchise application in three steps.",
    }),
});

function FranchisePage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      const res = await submitFranchiseApplication({
        data: {
          full_name: form.full_name ?? "",
          national_id: form.national_id ?? "",
          phone: form.phone ?? "",
          email: form.email ?? "",
          city: form.city ?? "",
          cr_number: form.cr_number ?? "",
          proposed_city: form.proposed_city ?? "",
          proposed_district: form.proposed_district ?? "",
          land_area_sqm: form.land_area_sqm ?? "",
          ownership_status: form.ownership_status ?? "",
          investment_capital_sar: form.investment_capital_sar ?? "",
          notes: form.notes ?? "",
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


  const steps = [t("franchise.steps.personal"), t("franchise.steps.location"), t("franchise.steps.financial")];

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("franchise.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{t("franchise.intro")}</p>
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
            <p className="mt-6 font-semibold">{t("franchise.about.caption")}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
                {t("franchise.about.statA")}
              </span>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
                {t("franchise.about.statB")}
              </span>
            </div>
            <Button
              onClick={() => document.getElementById("franchise-form")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
            >
              {t("franchise.about.cta")}
            </Button>
          </div>
        </div>
      </section>

      <section id="franchise-form" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16">

        {ref ? (
          <Card><CardContent className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
            <h2 className="mt-4 text-2xl font-bold">{t("common.thanks")}</h2>
            <p className="mt-2 text-muted-foreground">{t("common.referenceSaved")} <span className="font-mono">{ref}</span></p>
          </CardContent></Card>
        ) : (
          <Card><CardContent className="p-8">
            <ol className="mb-8 flex items-center justify-between">
              {steps.map((label, i) => (
                <li key={i} className="flex flex-1 items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${i <= step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                  <span className="ms-2 hidden text-sm sm:inline">{label}</span>
                  {i < 2 && <div className={`mx-2 h-px flex-1 ${i < step ? "bg-accent" : "bg-border"}`} />}
                </li>
              ))}
            </ol>

            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <F label={t("common.fullName")}><Input value={form.full_name ?? ""} onChange={(e) => upd("full_name", e.target.value)} /></F>
                <F label={t("franchise.f.nationalId")}><Input value={form.national_id ?? ""} onChange={(e) => upd("national_id", e.target.value)} /></F>
                <F label={t("common.phone")}><Input value={form.phone ?? ""} onChange={(e) => upd("phone", e.target.value)} /></F>
                <F label={t("common.email")}><Input type="email" value={form.email ?? ""} onChange={(e) => upd("email", e.target.value)} /></F>
                <F label={t("common.city")}><CitySelect value={form.city} onChange={(v) => upd("city", v)} /></F>
                <F label={t("franchise.f.crNumber")}><Input value={form.cr_number ?? ""} onChange={(e) => upd("cr_number", e.target.value)} /></F>
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <F label={t("franchise.f.proposedCity")}><CitySelect value={form.proposed_city} onChange={(v) => upd("proposed_city", v)} /></F>
                <F label={t("franchise.f.proposedDistrict")}><Input value={form.proposed_district ?? ""} onChange={(e) => upd("proposed_district", e.target.value)} /></F>
                <F label={t("franchise.f.landArea")}><Input type="number" value={form.land_area_sqm ?? ""} onChange={(e) => upd("land_area_sqm", e.target.value)} /></F>
                <F label={t("franchise.f.ownership")}><Input placeholder={t("franchise.f.ownershipPlaceholder")} value={form.ownership_status ?? ""} onChange={(e) => upd("ownership_status", e.target.value)} /></F>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-4">
                <F label={t("franchise.f.capital")}><Input type="number" value={form.investment_capital_sar ?? ""} onChange={(e) => upd("investment_capital_sar", e.target.value)} /></F>
                <F label={t("common.message")}><Textarea rows={5} value={form.notes ?? ""} onChange={(e) => upd("notes", e.target.value)} /></F>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2)}>{t("common.back")}</Button>
              {step < 2 ? (
                <Button onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2)} className="bg-accent text-accent-foreground hover:bg-accent/90">{t("common.next")}</Button>
              ) : (

                <Button onClick={submit} disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {busy ? t("common.submitting") : t("franchise.submit")}
                </Button>
              )}
            </div>
          </CardContent></Card>
        )}
      </section>
    </SiteLayout>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}
