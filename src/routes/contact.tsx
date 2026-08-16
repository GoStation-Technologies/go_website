import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { submitContactMessage } from "@/lib/submissions.functions";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, MapPin, Clock, Phone, MessageCircle, Headphones } from "lucide-react";
import { StationsMap } from "@/components/stations-map";

const HQ = { lat: 24.7028, lng: 46.6752 };
const HQ_DIRECTIONS = "https://www.google.com/maps/search/?api=1&query=24.7028,46.6752";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () =>
    pageHead({
      path: "/contact",
      title: "Contact GoStation — Support, Media & Partnerships",
      description:
        "Get in touch with GoStation. Send a support request, complaint, media or partnership enquiry and our team will reply with a reference number.",
    }),
});

function ContactPage() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const channels = (t("contact.channels", { returnObjects: true }) as string[]) ?? [];
  const cats = ["general", "support", "complaint", "franchise", "acquisition", "media", "investor"] as const;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const form = e.currentTarget;
    try {
      const res = await submitContactMessage({
        data: {
          full_name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          category: String(fd.get("category") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: String(fd.get("message") ?? ""),
        },
      });
      setRef(res.reference);
      toast.success(t("common.thanks"));
      form.reset();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("contact.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{t("contact.intro")}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 className="text-lg font-bold text-accent">{t("contact.infoTitle")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("contact.infoBody")}</p>
              </div>
              <div>
                <div className="text-sm font-semibold text-accent">{t("contact.hqTitle")}</div>
                <div className="mt-1 text-sm font-medium">{t("contact.hqName")}</div>
                <div className="text-sm text-muted-foreground">{t("contact.hqAddress")}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-accent">{t("contact.channelsTitle")}</div>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {channels.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          <InfoRow icon={Clock} title={t("contact.hours")} text={t("contact.address")} />
          <InfoRow icon={Mail} title="Email" text="contact@gostation.net" />
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold">{t("contact.formTitle")}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("contact.formSub")}</p>
            </div>
            {ref && (
              <div className="mb-6 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm">
                <div className="font-semibold">{t("common.thanks")}</div>
                <div className="mt-1">{t("common.referenceSaved")} <span className="font-mono">{ref}</span></div>
              </div>
            )}
            <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
              <Field label={t("common.fullName")}><Input name="name" required /></Field>
              <Field label={t("common.email")}><Input name="email" type="email" required /></Field>
              <Field label={t("common.phone")}><Input name="phone" /></Field>
              <Field label={t("common.category")}>
                <Select name="category" defaultValue="general" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c} value={c}>{t(`contact.cats.${c}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("common.subject")} className="md:col-span-2"><Input name="subject" required /></Field>
              <Field label={t("common.message")} className="md:col-span-2"><Textarea name="message" rows={6} required /></Field>
              <div className="md:col-span-2">
                <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {busy ? t("common.submitting") : t("common.submit")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold">{t("contact.mapTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("contact.mapSub")}</p>
          </div>
          <a
            href={HQ_DIRECTIONS}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
          >
            <MapPin className="h-4 w-4" />
            {t("contact.directions")}
          </a>
        </div>
        <StationsMap
            points={[
              {
                id: "hq",
                lat: HQ.lat,
                lng: HQ.lng,
                title: t("contact.hqName"),
                subtitle: t("contact.hqAddress"),
                href: HQ_DIRECTIONS,
              },
            ]}
            center={[HQ.lat, HQ.lng]}
            zoom={14}
          className="h-[420px] w-full overflow-hidden rounded-xl border"
        />
      </section>

    </SiteLayout>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={"grid gap-1.5 " + className}><Label>{label}</Label>{children}</div>;
}
function InfoRow({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <Card><CardContent className="flex items-start gap-3 p-5">
      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Icon className="h-4 w-4" /></div>
      <div><div className="text-sm font-semibold">{title}</div><div className="text-sm text-muted-foreground">{text}</div></div>
    </CardContent></Card>
  );
}
