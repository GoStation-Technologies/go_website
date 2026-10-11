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