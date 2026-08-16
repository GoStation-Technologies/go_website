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
      <section className="relative overflow-hidden bg-ink py-20 text-white md:py-28">
        {/* Layered navy → orange gradient background */}
        <div className="absolute inset-0 bg-hero-ink" />
        <div className="absolute -top-1/4 right-0 h-[600px] w-[600px] rounded-full bg-ember/15 blur-[120px] animate-pulse-glow" />
        <div className="absolute -bottom-1/4 left-0 h-[500px] w-[500px] rounded-full bg-ember/10 blur-[100px]" />
        <div className="absolute inset-0 bg-grid-ink opacity-40" />

        {/* Floating interactive contact icons */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <a
            href="mailto:contact@gostation.net"
            className="pointer-events-auto absolute top-[18%] right-[12%] flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 shadow-elegant transition-all duration-300 hover:scale-110 hover:bg-ember/20 hover:border-ember/30 hover:shadow-glow animate-float-slow"
            aria-label={t("common.email")}
          >
            <Mail className="h-6 w-6 text-white" />
          </a>
          <a
            href="tel:920002168"
            className="pointer-events-auto absolute top-[40%] left-[8%] flex h-16 w-16 items-center justify-center rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 shadow-elegant transition-all duration-300 hover:scale-110 hover:bg-ember/20 hover:border-ember/30 hover:shadow-glow animate-float-slow-delay"
            aria-label={t("contact.callCenter")}
          >
            <Phone className="h-7 w-7 text-white" />
          </a>
          <a
            href="#contact-form"
            className="pointer-events-auto absolute bottom-[22%] right-[18%] flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 shadow-elegant transition-all duration-300 hover:scale-110 hover:bg-ember/20 hover:border-ember/30 hover:shadow-glow animate-float-slow-delay-2"
            aria-label={t("common.message")}
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </a>
          <a
            href="#hq-map"
            className="pointer-events-auto absolute bottom-[30%] left-[14%] flex h-12 w-12 items-center justify-center rounded-xl bg-white/8 backdrop-blur-sm border border-white/10 shadow-elegant transition-all duration-300 hover:scale-110 hover:bg-ember/20 hover:border-ember/30 hover:shadow-glow animate-float-slow"
            aria-label={t("contact.mapTitle")}
          >
            <MapPin className="h-5 w-5 text-white" />
          </a>
          <div className="pointer-events-auto absolute top-[25%] left-[28%] flex h-10 w-10 items-center justify-center rounded-lg bg-ember/20 backdrop-blur-sm border border-ember/20 transition-all duration-300 hover:scale-110 hover:bg-ember/30 animate-float-slow-delay-2">
            <Headphones className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm border border-white/10 animate-rise-in">
            <span className="h-2 w-2 rounded-full bg-ember" />
            {t("contact.infoTitle")}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold md:text-6xl lg:text-7xl animate-rise-in" style={{ animationDelay: "0.1s" }}>
            {t("contact.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80 animate-rise-in" style={{ animationDelay: "0.2s" }}>
            {t("contact.intro")}
          </p>
        </div>

        {/* Animated wavy lines */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
          <div className="absolute bottom-0 flex w-[200%] animate-wave-flow-slow">
            <svg className="h-28 w-1/2" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path
                fill="rgba(255,255,255,0.04)"
                d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
              />
            </svg>
            <svg className="h-28 w-1/2" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path
                fill="rgba(255,255,255,0.04)"
                d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
              />
            </svg>
          </div>
          <div className="absolute bottom-0 flex w-[200%] animate-wave-flow">
            <svg className="h-24 w-1/2" viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path
                fill="rgba(232,93,58,0.12)"
                d="M0,50 C360,100 720,0 1080,50 C1260,80 1350,20 1440,50 L1440,100 L0,100 Z"
              />
            </svg>
            <svg className="h-24 w-1/2" viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path
                fill="rgba(232,93,58,0.12)"
                d="M0,50 C360,100 720,0 1080,50 C1260,80 1350,20 1440,50 L1440,100 L0,100 Z"
              />
            </svg>
          </div>
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
          <InfoRow icon={Phone} title={t("contact.callCenter")} text={t("contact.callNumber")} tel />
        </div>

        <Card id="contact-form">
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

      <section id="hq-map" className="mx-auto max-w-7xl px-4 pb-20">
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
function InfoRow({ icon: Icon, title, text, tel }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; tel?: boolean }) {
  return (
    <Card><CardContent className="flex items-start gap-3 p-5">
      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        {tel ? (
          <a href={`tel:${text}`} className="text-sm text-muted-foreground hover:text-accent" dir="ltr">{text}</a>
        ) : (
          <div className="text-sm text-muted-foreground">{text}</div>
        )}
      </div>
    </CardContent></Card>
  );
}
