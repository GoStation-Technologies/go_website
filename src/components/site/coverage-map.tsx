import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fuelLabel } from "@/lib/regions";
import { useActiveStationRegions } from "@/hooks/use-station-stats";

const StationsMap = lazy(() =>
  import("@/components/stations-map").then((m) => ({ default: m.StationsMap })),
);

const FUEL_CODES = ["95", "91", "98", "diesel"] as const;

/** Interactive KSA coverage map with region + fuel-type filters. */
export function CoverageMap() {
  const { i18n } = useTranslation();
  const ar = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";
  const [region, setRegion] = useState("all");
  const [fuel, setFuel] = useState("all");
  const { data: regions = [] } = useActiveStationRegions();

  const { data = [] } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const { data } = await supabase.from("stations").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  const points = useMemo(
    () =>
      data
        .filter((s) => (region === "all" ? true : s.region_id === region))
        .filter((s) => (fuel === "all" ? true : (s.fuel_types ?? []).includes(fuel)))
        .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
        .map((s) => ({
          id: s.id,
          lat: s.lat as number,
          lng: s.lng as number,
          title: (ar ? s.name_ar : s.name_en) ?? "GoStation",
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
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder={ar ? "المنطقة" : "Region"} />
          </SelectTrigger>
          <SelectContent className="z-[2000]">
            <SelectItem value="all">{ar ? "كل المناطق" : "All regions"}</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {(ar ? r.name_ar : r.name_en) ?? r.name}
              </SelectItem>
            ))}

          </SelectContent>
        </Select>
        <Select value={fuel} onValueChange={setFuel}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={ar ? "نوع الوقود" : "Fuel type"} />
          </SelectTrigger>
          <SelectContent className="z-[2000]">
            <SelectItem value="all">{ar ? "كل الأنواع" : "All fuel types"}</SelectItem>
            {FUEL_CODES.map((f) => (
              <SelectItem key={f} value={f}>
                {fuelLabel(f, ar)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ms-auto text-sm text-muted-foreground">
          {points.length} {ar ? "محطة" : "stations"}
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
