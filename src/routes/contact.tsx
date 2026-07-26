import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({ meta: [{ title: "Contact — GoStation" }] }),
});

function ContactPage() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const cats = ["general", "support", "complaint", "franchise", "acquisition", "media", "investor"] as const;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await supabase.from("contact_messages").insert({
      full_name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone") ?? ""),
      category: String(fd.get("category")),
      subject: String(fd.get("subject")),
      message: String(fd.get("message")),
    }).select("reference").single();
    setBusy(false);
    if (error) return toast.error(t("common.error"));
    setRef(data.reference);
    toast.success(t("common.thanks"));
    (e.target as HTMLFormElement).reset();
  };

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("contact.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{t("contact.intro")}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-8">
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

        <div className="space-y-4">
          <InfoRow icon={MapPin} title="Address" text={t("contact.address")} />
          <InfoRow icon={Clock} title="Hours" text={t("contact.hours")} />
          <InfoRow icon={Mail} title="Email" text="contact@gostation.sa" />
          <InfoRow icon={Phone} title="Phone" text="+966 92000 0000" />
        </div>
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
