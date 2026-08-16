import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Fuel, Search, Star, Clock, X } from "lucide-react";
import { ClientOnly } from "@tanstack/react-router";
import { regionForCity, regionLabel, fuelLabel, SAUDI_REGIONS } from "@/lib/regions";

const StationsMap = lazy(() =>
  import("@/components/stations-map").then((m) => ({ default: m.StationsMap })),
);


export const Route = createFileRoute("/stations")({
  component: StationsPage,
  head: () =>
    pageHead({
      path: "/stations",
      title: "Find a GoStation — Station Locator & Live Fuel Prices",
      description:
        "Search 180+ GoStation fuel stations across 13 Saudi regions. Filter by city, services and amenities, and view live fuel prices on the map.",
    }),
});

function StationsPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const ar = lng === "ar";
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [fuel, setFuel] = useState("all");
  const { data = [] } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const { data } = await supabase.from("stations").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  const regionOptions = useMemo(() => {
    const present = new Set(
      data.map((s) => regionForCity(s.city_en, s.city_ar)).filter(Boolean) as string[],
    );
    return SAUDI_REGIONS.filter((r) => present.has(r.value));
  }, [data]);

  const fuelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of data) for (const f of s.fuel_types ?? []) set.add(f);
    return [...set].sort();
  }, [data]);

  const filtered = data.filter((s) => {
    const hay = [s.city_ar, s.city_en, s.district_ar, s.district_en, s.name_ar, s.name_en].filter(Boolean).join(" ").toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
    if (region !== "all" && regionForCity(s.city_en, s.city_ar) !== region) return false;
    if (fuel !== "all" && !(s.fuel_types ?? []).includes(fuel)) return false;
    return true;
  });

  const mapPoints = useMemo(
    () =>
      filtered
        .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
        .map((s) => ({
          id: s.id,
          lat: s.lat as number,
          lng: s.lng as number,
          title: (lng === "ar" ? s.name_ar : s.name_en) ?? "Station",
          subtitle: lng === "ar"
            ? [s.city_ar, s.district_ar].filter(Boolean).join(" · ")
            : [s.city_en, s.district_en].filter(Boolean).join(" · "),
          href: `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`,
        })),
    [filtered, lng],
  );

  const hasFilters = region !== "all" || fuel !== "all" || q !== "";

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("stations.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{t("stations.intro")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("stations.search")} className="ps-9" />
          </div>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={ar ? "المنطقة" : "Region"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "كل المناطق" : "All regions"}</SelectItem>
              {regionOptions.map((r) => (
                <SelectItem key={r.value} value={r.value}>{ar ? r.ar : r.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fuel} onValueChange={setFuel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={ar ? "نوع الوقود" : "Fuel type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "كل الأنواع" : "All fuel types"}</SelectItem>
              {fuelOptions.map((f) => (
                <SelectItem key={f} value={f}>{fuelLabel(f, ar)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setRegion("all");
                setFuel("all");
              }}
            >
              <X className="me-1 h-4 w-4" />
              {ar ? "مسح" : "Clear"}
            </Button>
          )}
          <div className="text-sm text-muted-foreground">{filtered.length} / {data.length}</div>
        </div>


        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="min-h-[480px] overflow-hidden p-0">
            <ClientOnly
              fallback={
                <div className="flex h-[480px] items-center justify-center bg-muted">
                  <MapPin className="h-8 w-8 animate-pulse text-accent" />
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="flex h-[480px] items-center justify-center bg-muted">
                    <MapPin className="h-8 w-8 animate-pulse text-accent" />
                  </div>
                }
              >
                <StationsMap
                  className="h-[480px] w-full"
                  points={mapPoints}
                />
              </Suspense>
            </ClientOnly>
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
                        <Fuel className="h-3 w-3" /> {fuelLabel(f, ar)}
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
