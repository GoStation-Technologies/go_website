import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/acquisitions")({
  component: AcqPage,
  head: () => ({ meta: [{ title: "Sell your station — GoStation" }] }),
});

function AcqPage() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await (supabase.rpc as any)("submit_acquisition_request", {
      payload: {
        full_name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        email: String(fd.get("email") ?? ""),
        station_name: String(fd.get("station") ?? ""),
        city: String(fd.get("city") ?? ""),
        district: String(fd.get("district") ?? ""),
        land_area_sqm: String(fd.get("area") ?? ""),
        fuel_pumps_count: String(fd.get("pumps") ?? ""),
        avg_daily_sales_sar: String(fd.get("sales") ?? ""),
        notes: String(fd.get("notes") ?? ""),
      },
    });
    setBusy(false);
    if (error || !data) return toast.error(t("common.error"));
    setRef(data as string);
    toast.success(t("common.thanks"));
  };

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("acq.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{t("acq.intro")}</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16">
        {ref ? (
          <Card><CardContent className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
            <h2 className="mt-4 text-2xl font-bold">{t("common.thanks")}</h2>
            <p className="mt-2 text-muted-foreground">{t("common.referenceSaved")} <span className="font-mono">{ref}</span></p>
          </CardContent></Card>
        ) : (
          <Card><CardContent className="p-8">
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <F label={t("common.fullName")}><Input name="name" required /></F>
              <F label={t("common.phone")}><Input name="phone" required /></F>
              <F label={t("common.email")} className="sm:col-span-2"><Input type="email" name="email" required /></F>
              <F label="Station name"><Input name="station" /></F>
              <F label={t("common.city")}><Input name="city" /></F>
              <F label="District"><Input name="district" /></F>
              <F label="Land area (sqm)"><Input type="number" name="area" /></F>
              <F label="Fuel pumps"><Input type="number" name="pumps" /></F>
              <F label="Avg daily sales (SAR)"><Input type="number" name="sales" /></F>
              <F label={t("common.message")} className="sm:col-span-2"><Textarea rows={5} name="notes" /></F>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {busy ? t("common.submitting") : t("common.submit")}
                </Button>
              </div>
            </form>
          </CardContent></Card>
        )}
      </section>
    </SiteLayout>
  );
}
function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={"grid gap-1.5 " + className}><Label>{label}</Label>{children}</div>;
}
