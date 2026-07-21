import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Fuel, Search, Star, Clock } from "lucide-react";

export const Route = createFileRoute("/stations")({
  component: StationsPage,
  head: () => ({ meta: [{ title: "Stations — GoStation" }] }),
});

function StationsPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const { data } = await supabase.from("stations").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  const filtered = data.filter((s) => {
    const hay = [s.city_ar, s.city_en, s.district_ar, s.district_en, s.name_ar, s.name_en].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("stations.title")}</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">{t("stations.intro")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("stations.search")} className="ps-9" />
          </div>
          <div className="text-sm text-muted-foreground">{filtered.length} / {data.length}</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Placeholder map */}
          <Card className="min-h-[420px] overflow-hidden">
            <div className="relative h-full min-h-[420px] bg-gradient-to-br from-primary/10 via-muted to-accent/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-10 w-10 text-accent" />
                  <p className="mt-2 text-sm text-muted-foreground">Interactive map — Google Maps integration pending</p>
                </div>
              </div>
              {filtered.slice(0, 8).map((s, i) => (
                <div key={s.id} className="absolute h-3 w-3 rounded-full bg-accent shadow-lg ring-4 ring-accent/30"
                  style={{ top: `${15 + (i * 11) % 70}%`, left: `${10 + (i * 17) % 80}%` }} />
              ))}
            </div>
          </Card>
          <div className="max-h-[520px] space-y-3 overflow-y-auto pe-2">
            {filtered.map((s) => (
              <Card key={s.id} className="transition hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{lng === "ar" ? s.name_ar : s.name_en}</h3>
                      <p className="text-xs text-muted-foreground">{lng === "ar" ? `${s.city_ar} · ${s.district_ar ?? ""}` : `${s.city_en} · ${s.district_en ?? ""}`}</p>
                    </div>
                    {s.is_24h && <Badge className="bg-accent text-accent-foreground"><Clock className="me-1 h-3 w-3" />{t("stations.open24")}</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(s.fuel_types ?? []).map((f: string) => (
                      <span key={f} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                        <Fuel className="h-3 w-3" /> {f}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {s.google_rating && <span className="inline-flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-accent text-accent" />{s.google_rating}</span>}
                    <Button asChild size="sm" variant="outline">
                      <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}>{t("stations.directions")}</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
