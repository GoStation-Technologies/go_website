/** Preserve source statuses without implying that inactive stations are open. */
export function stationStatusLabel(station: { is_active: boolean; status?: string | null }, ar: boolean) {
  if (station.is_active) return ar ? "تعمل الآن" : "Operating";
  const status = station.status?.trim();
  if (status === "تحت الانشاء") return ar ? "تحت الإنشاء" : "Under construction";
  if (status === "تحت التاهيل") return ar ? "تحت التأهيل" : "Under renovation";
  if (status === "تحت التطوير") return ar ? "تحت التطوير" : "Under development";
  if (status === "مغلقة") return ar ? "مغلقة" : "Closed";
  if (status?.toLowerCase() === "under maintenance") return ar ? "تحت الصيانة" : "Under maintenance";
  return ar ? "غير مشغّلة حالياً" : "Not operating";
}
/** Station label in the latest naming: "GO44 - short name". The code comes from the English source name. */
export function stationDisplayName(
  s: { name_ar?: string | null; name_en?: string | null },
  ar: boolean,
): string {
  const en = (s.name_en ?? "").trim();
  const code = en.match(/^(GO\s*\d+)/i)?.[1]?.replace(/\s+/g, "").toUpperCase() ?? "";
  const base = ((ar ? s.name_ar : s.name_en) ?? "").trim();
  if (!code) return base || "GoStation";
  const short = base.replace(/^GO\s*\d+\s*[-–:]\s*/i, "").trim();
  return short ? `${code} - ${short}` : code;
}

/** Numeric station code for sorting (GO44 → 44). */
export function stationNumber(s: { name_en?: string | null }): number {
  const m = (s.name_en ?? "").match(/^GO\s*(\d+)/i);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}
