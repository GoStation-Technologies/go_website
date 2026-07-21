import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Download, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/investors")({
  component: IRPage,
  head: () => ({ meta: [{ title: "Investor Relations — GoStation" }] }),
});

function IRPage() {
  const { t, i18n } = useTranslation();
  const lng = (i18n.language || "en").startsWith("ar") ? "ar" : "en";
  const { data: reports = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_reports").select("*").eq("is_published", true).order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await supabase.from("ir_inquiries").insert({
      full_name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone") ?? "") || null,
      organization: String(fd.get("org") ?? "") || null,
      inquiry_type: String(fd.get("type")),
      message: String(fd.get("message")),
    }).select("reference").single();
    setBusy(false);
    if (error) return toast.error(t("common.error"));
    setRef(data.reference);
    toast.success(t("common.thanks"));
    (e.target as HTMLFormElement).reset();
  };

  const kpis = [
    { label: lng === "ar" ? "الإيرادات" : "Revenue", value: "3.2B SAR", icon: TrendingUp },
    { label: lng === "ar" ? "النمو السنوي" : "YoY growth", value: "+18%", icon: TrendingUp },
    { label: lng === "ar" ? "المحطات" : "Stations", value: "180", icon: FileText },
  ];

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("investors.title")}</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">{t("investors.intro")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {kpis.map((k) => (
            <Card key={k.label}><CardContent className="p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><k.icon className="h-5 w-5" /></div>
              <div className="mt-3 text-3xl font-extrabold">{k.value}</div>
              <div className="text-sm text-muted-foreground">{k.label}</div>
            </CardContent></Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <h2 className="mb-4 text-2xl font-bold">{t("investors.reports")}</h2>
        <div className="grid gap-3">
          {reports.length === 0 && <p className="text-muted-foreground">No reports yet.</p>}
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-accent" />
                  <div>
                    <div className="font-semibold">{lng === "ar" ? r.title_ar : r.title_en}</div>
                    <div className="text-xs text-muted-foreground">{r.report_type} · {r.report_year}</div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" onClick={() => supabase.from("report_downloads").insert({ report_id: r.id })}>
                  <a href={r.file_url} target="_blank" rel="noreferrer"><Download className="me-1 h-4 w-4" />{t("investors.download")}</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-4 text-2xl font-bold">{t("investors.contact")}</h2>
        <Card><CardContent className="p-8">
          {ref && <div className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">{t("common.referenceSaved")} <span className="font-mono">{ref}</span></div>}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <F label={t("common.fullName")}><Input name="name" required /></F>
            <F label={t("common.email")}><Input type="email" name="email" required /></F>
            <F label={t("common.phone")}><Input name="phone" /></F>
            <F label="Organization"><Input name="org" /></F>
            <F label="Inquiry type" className="sm:col-span-2">
              <Select name="type" defaultValue="general" required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="press">Press</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label={t("common.message")} className="sm:col-span-2"><Textarea rows={5} name="message" required /></F>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {busy ? t("common.submitting") : t("common.submit")}
              </Button>
            </div>
          </form>
        </CardContent></Card>
      </section>
    </SiteLayout>
  );
}
function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={"grid gap-1.5 " + className}><Label>{label}</Label>{children}</div>;
}
