import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitContactMessage } from "@/lib/submissions.functions";
import { SiteLayout } from "@/components/site/site-layout";
import { CitySelect } from "@/components/site/city-select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Store, Info, Clock, FileText, Building2 } from "lucide-react";
const stationImg = { url: "/station-canopy.jpg" };

export const Route = createFileRoute("/leasing")({
  component: LeasingPage,
  head: () =>
    pageHead({
      path: "/leasing",
      title: "Real Estate Leasing — GoStation",
      description:
        "Lease retail space at GoStation fuel stations across Saudi Arabia. Share your requirements and our leasing team will get back to you.",
    }),
});

function LeasingPage() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [city, setCity] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const details = [
      `${t("lease.f.company")}: ${String(fd.get("company") ?? "")}`,
      `${t("lease.f.activity")}: ${String(fd.get("activity") ?? "")}`,
      `${t("common.city")}: ${city}`,
      `${t("lease.f.district")}: ${String(fd.get("district") ?? "")}`,
      `${t("lease.f.area")}: ${String(fd.get("area") ?? "")}`,
      `${t("lease.f.duration")}: ${String(fd.get("duration") ?? "")}`,
      "",
      String(fd.get("notes") ?? ""),
    ].join("\n");

    setBusy(true);
    try {
      const res = await submitContactMessage({
        data: {
          full_name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          category: "leasing",
          subject: t("lease.formTitle"),
          message: details.slice(0, 4000),
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
    { icon: Info, title: t("lease.facts.spaces"), body: t("lease.facts.spacesBody") },
    { icon: Clock, title: t("lease.facts.timeline"), body: t("lease.facts.timelineBody") },
    { icon: FileText, title: t("lease.facts.docs"), body: t("lease.facts.docsBody") },
  ];

  return (
    <SiteLayout>
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
            <Store className="h-3.5 w-3.5" />
            {t("lease.eyebrow")}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-primary md:text-4xl">{t("lease.title")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">{t("lease.lead")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-bold">{t("lease.detailsTitle")}</h2>
              <div className="mt-4 overflow-hidden rounded-xl">
                <img
                  src={stationImg.url}
                  alt={t("lease.title")}
                  loading="lazy"
                  className="h-56 w-full object-cover md:h-64"
                />
              </div>
              <ul className="mt-6 grid gap-3">
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
                      <h2 className="text-lg font-bold">{t("lease.formTitle")}</h2>
                      <p className="text-sm text-muted-foreground">{t("lease.formSub")}</p>
                    </div>
                  </div>

                  <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                    <F label={t("common.fullName")}><Input name="name" required /></F>
                    <F label={t("common.phone")}><Input name="phone" required /></F>
                    <F label={t("common.email")} className="sm:col-span-2"><Input type="email" name="email" required /></F>
                    <F label={t("lease.f.company")}><Input name="company" /></F>
                    <F label={t("lease.f.activity")}><Input name="activity" /></F>
                    <F label={t("common.city")}><CitySelect value={city} onChange={setCity} /></F>
                    <F label={t("lease.f.district")}><Input name="district" /></F>
                    <F label={t("lease.f.area")}><Input type="number" name="area" /></F>
                    <F label={t("lease.f.duration")}><Input type="number" name="duration" /></F>
                    <F label={t("common.message")} className="sm:col-span-2"><Textarea rows={4} name="notes" /></F>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        {busy ? t("common.submitting") : t("lease.submitCta")}
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
