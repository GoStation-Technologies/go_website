type StationState = { is_active: boolean; status?: string | null };
export type LocatorStatus = "active" | "under_development";

/** Explicit closure/development takes precedence over a stale active flag. */
export function stationLocatorStatus(station: StationState): LocatorStatus | null {
  const status = (station.status ?? "").trim().toLowerCase()
    .replace(/[أإآ]/g, "ا").replace(/[_-]/g, " ").replace(/\s+/g, " ");
  if (["closed", "permanently closed", "مغلقة", "مغلق"].includes(status)) return null;
  if (["under development", "under renovation", "under construction", "under maintenance", "تحت التطوير", "تحت التاهيل", "تحت الانشاء", "تحت الصيانة"].includes(status)) return "under_development";
  if (station.is_active || ["active", "operational", "open", "نشطة", "شغالة", "مفتوحة"].includes(status)) return "active";
  return null;
}

export function isLocatorStation(station: StationState): boolean {
  return stationLocatorStatus(station) !== null;
}

/** Keep specific development labels without advertising those stations as open. */
export function stationStatusLabel(station: StationState, ar: boolean) {
  if (stationLocatorStatus(station) === "active") return ar ? "نشطة" : "Operating";
  const status = station.status?.trim();
  if (status === "تحت الانشاء") return ar ? "تحت الإنشاء" : "Under construction";
  if (status === "تحت التاهيل") return ar ? "تحت التأهيل" : "Under renovation";
  if (status === "تحت التطوير") return ar ? "تحت التطوير" : "Under development";
  if (status === "مغلقة") return ar ? "مغلقة" : "Closed";
  if (status?.toLowerCase() === "under maintenance") return ar ? "تحت الصيانة" : "Under maintenance";
  if (stationLocatorStatus(station) === "under_development") return ar ? "تحت التطوير" : "Under development";
  return ar ? "غير مشغّلة حالياً" : "Not operating";
}
/** Station label: "GO01 - District". Falls back to the city when the district is missing. */
export function stationDisplayName(
  s: {
    name_ar?: string | null;
    name_en?: string | null;
    district_ar?: string | null;
    district_en?: string | null;
    city_ar?: string | null;
    city_en?: string | null;
  },
  ar: boolean,
): string {
  const en = (s.name_en ?? "").trim();
  const code = en.match(/^(GO\s*\d+)/i)?.[1]?.replace(/\s+/g, "").toUpperCase() ?? "";
  const district = ((ar ? s.district_ar : s.district_en) ?? "").trim();
  const city = ((ar ? s.city_ar : s.city_en) ?? "").trim();
  const place = district || city;
  if (code && place) return `${code} - ${place}`;
  if (code) return code;
  if (place) return place;
  const base = ((ar ? s.name_ar : s.name_en) ?? "").trim();
  return base || "GoStation";
}

/** Numeric station code for sorting (GO44 → 44). */
export function stationNumber(s: { name_en?: string | null }): number {
  const m = (s.name_en ?? "").match(/^GO\s*(\d+)/i);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}
