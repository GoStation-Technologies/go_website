import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Fuel, Star, Clock, X, LocateFixed, Navigation } from "lucide-react";
import { ClientOnly } from "@tanstack/react-router";
import { fuelLabel } from "@/lib/regions";
import { useActiveStationRegions } from "@/hooks/use-station-stats";
import { useGeolocation } from "@/hooks/use-geolocation";
import { haversineKm, formatDistance } from "@/lib/geo";

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
        "Search 193+ GoStation fuel stations across Saudi Arabia. Filter by region, fuel type and services, and get directions from the live map.",
    }),
});

function StationsPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const ar = lng === "ar";
  const [region, setRegion] = useState("all");
  const [fuel, setFuel] = useState("all");
  const { data = [] } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const { data } = await supabase.from("stations").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  const { data: allRegions = [] } = useActiveStationRegions();
  const regionOptions = useMemo(() => {
    const present = new Set(data.map((s) => s.region_id).filter(Boolean) as string[]);
    return allRegions.filter((r) => present.has(r.id));
  }, [data, allRegions]);

  const fuelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of data) for (const f of s.fuel_types ?? []) set.add(f);
    return [...set].sort();
  }, [data]);

  const { coords, status: geoStatus, request: requestLocation } = useGeolocation(true);

  const filtered = useMemo(() => {
    const list = data
      .filter((s) => {
        if (region !== "all" && s.region_id !== region) return false;
        if (fuel !== "all" && !(s.fuel_types ?? []).includes(fuel)) return false;
        return true;
      })
      .map((s) => ({
        ...s,
        distanceKm:
          coords && typeof s.lat === "number" && typeof s.lng === "number"
            ? haversineKm(coords, { lat: s.lat, lng: s.lng })
            : null,
      }));

    if (coords) {
      return list.sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      );
    }
    return list.sort((a, b) =>
      ((ar ? a.name_ar : a.name_en) ?? "").localeCompare((ar ? b.name_ar : b.name_en) ?? "", ar ? "ar" : "en"),
    );
  }, [data, region, fuel, coords, ar]);


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

  const hasFilters = region !== "all" || fuel !== "all";

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
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={ar ? "المنطقة" : "Region"} />
            </SelectTrigger>
            <SelectContent className="z-[2000]">
              <SelectItem value="all">{ar ? "كل المناطق" : "All regions"}</SelectItem>
              {regionOptions.map((r) => (
                <SelectItem key={r.id} value={r.id}>{(ar ? r.name_ar : r.name_en) ?? r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fuel} onValueChange={setFuel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={ar ? "نوع الوقود" : "Fuel type"} />
            </SelectTrigger>
            <SelectContent className="z-[2000]">
              <SelectItem value="all">{ar ? "كل الأنواع" : "All fuel types"}</SelectItem>
              {fuelOptions.map((f) => (
                <SelectItem key={f} value={f}>{fuelLabel(f, ar)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={requestLocation} disabled={geoStatus === "prompting"}>
            <LocateFixed className="me-1 h-4 w-4" />
            {ar ? "موقعي الحالي" : "Use my location"}
          </Button>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
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

        {(geoStatus === "denied" || geoStatus === "unavailable") && (
          <p className="mb-4 text-sm text-muted-foreground">
            {ar
              ? "تعذّر تحديد موقعك — يتم عرض جميع المحطات بالترتيب الأبجدي."
              : "Location unavailable — showing all stations alphabetically."}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="relative min-h-[480px] overflow-hidden p-0">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={ar ? "موقعي الحالي" : "Use my location"}
              onClick={requestLocation}
              className="absolute end-3 top-3 z-[1000] h-9 w-9 rounded-full shadow-md"
            >
              <Navigation className="h-4 w-4" />
            </Button>
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
