import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { locatorStationsQuery } from "@/lib/locator-stations";
import { getContentLanguage } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fuelLabel } from "@/lib/regions";
import { useActiveStationRegions, useStationStats } from "@/hooks/use-station-stats";
import { stationDisplayName, stationStatusLabel, stationLocatorStatus } from "@/lib/station-status";

const StationsMap = lazy(() =>
  import("@/components/stations-map").then((m) => ({ default: m.StationsMap })),
);

const FUEL_ORDER = ["91", "95", "98", "diesel", "kerosene", "ev"];

/** Interactive KSA coverage map with region + fuel-type filters. */
export function CoverageMap() {
  const { i18n } = useTranslation();
  const ar = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";
  const [region, setRegion] = useState("all");
  const [fuel, setFuel] = useState("all");
  const { data: regions = [] } = useActiveStationRegions();

  const { data = [] } = useQuery(locatorStationsQuery);
  const { stationsCount } = useStationStats();
  const regionOptions = regions.filter(r => data.some(s => s.region_id === r.id));

  const fuelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of data) for (const f of s.fuel_types ?? []) set.add(f);
    return [...set].sort((a, b) => {
      const ia = FUEL_ORDER.indexOf(a);
      const ib = FUEL_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }, [data]);

  const points = useMemo(
    () =>
      data
        .filter((s) => (region === "all" ? true : s.region_id === region))
        .filter((s) => (fuel === "all" ? true : (s.fuel_types ?? []).includes(fuel)))
        .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
        .map((s) => ({
          id: s.id,
          status: stationLocatorStatus(s) ?? undefined,
          statusLabel: stationStatusLabel(s, ar),
          lat: s.lat as number,
          lng: s.lng as number,
          title: stationDisplayName(s, ar),
          subtitle: ar
            ? [s.city_ar, s.district_ar].filter(Boolean).join(" · ")
            : [s.city_en, s.district_en].filter(Boolean).join(" · "),
          href: `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`,
        })),
    [data, region, fuel, ar],
  );


  const fallback = (
    <div className="flex h-[420px] items-center justify-center bg-muted">
      <MapPin className="h-8 w-8 animate-pulse text-accent" />
    </div>
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-[190px]" aria-label={ar ? "المنطقة" : "Region"}>
            <SelectValue placeholder={ar ? "المنطقة" : "Region"} />
          </SelectTrigger>
          <SelectContent className="z-[2000]">
            <SelectItem value="all">{ar ? "كل المناطق" : "All regions"}</SelectItem>
            {regionOptions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {(ar ? r.name_ar : r.name_en) ?? r.name}
              </SelectItem>
            ))}

          </SelectContent>
        </Select>
        <Select value={fuel} onValueChange={setFuel}>
          <SelectTrigger className="w-[170px]" aria-label={ar ? "نوع الوقود" : "Fuel type"}>
            <SelectValue placeholder={ar ? "نوع الوقود" : "Fuel type"} />
          </SelectTrigger>
          <SelectContent className="z-[2000]">
            <SelectItem value="all">{ar ? "كل الأنواع" : "All fuel types"}</SelectItem>
            {fuelOptions.map((f) => (
              <SelectItem key={f} value={f}>
                {fuelLabel(f, ar)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ms-auto text-sm text-muted-foreground">
          <span className="me-3 inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-station-active" />{ar ? "نشطة" : "Operating"}</span>
          <span className="me-3 inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-station-development" />{ar ? "تحت التطوير" : "Under development"}</span>
          {stationsCount} {ar ? "محطة" : "stations"}
          <span className="ms-3">{ar ? `المعروضة: ${points.length}` : `Shown: ${points.length}`}</span>
        </span>
      </div>
      <ClientOnly fallback={fallback}>
        <Suspense fallback={fallback}>
          <StationsMap className="h-[420px] w-full" points={points} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
