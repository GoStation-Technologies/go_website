import { getContentLanguage } from "@/lib/i18n";

/**
 * Canonical Saudi city list. The stored value is always the English name so
 * existing records stay valid; the label shown to the user follows the active
 * language, which prevents mixed Arabic/English city text in tables and forms.
 */
export type City = { value: string; en: string; ar: string };

export const SAUDI_CITIES: City[] = [
  { value: "Riyadh", en: "Riyadh", ar: "الرياض" },
  { value: "Jeddah", en: "Jeddah", ar: "جدة" },
  { value: "Makkah", en: "Makkah", ar: "مكة المكرمة" },
  { value: "Madinah", en: "Madinah", ar: "المدينة المنورة" },
  { value: "Dammam", en: "Dammam", ar: "الدمام" },
  { value: "Khobar", en: "Khobar", ar: "الخبر" },
  { value: "Dhahran", en: "Dhahran", ar: "الظهران" },
  { value: "Jubail", en: "Jubail", ar: "الجبيل" },
  { value: "Khafji", en: "Khafji", ar: "الخفجي" },
  { value: "Hafar Al-Batin", en: "Hafar Al-Batin", ar: "حفر الباطن" },
  { value: "Qatif", en: "Qatif", ar: "القطيف" },
  { value: "Ahsa", en: "Al-Ahsa", ar: "الأحساء" },
  { value: "Buraydah", en: "Buraydah", ar: "بريدة" },
  { value: "Unaizah", en: "Unaizah", ar: "عنيزة" },
  { value: "Hail", en: "Hail", ar: "حائل" },
  { value: "Tabuk", en: "Tabuk", ar: "تبوك" },
  { value: "Arar", en: "Arar", ar: "عرعر" },
  { value: "Sakaka", en: "Sakaka", ar: "سكاكا" },
  { value: "Jazan", en: "Jazan", ar: "جازان" },
  { value: "Abha", en: "Abha", ar: "أبها" },
  { value: "Khamis Mushait", en: "Khamis Mushait", ar: "خميس مشيط" },
  { value: "Najran", en: "Najran", ar: "نجران" },
  { value: "Bisha", en: "Bisha", ar: "بيشة" },
  { value: "Al Baha", en: "Al Baha", ar: "الباحة" },
  { value: "Taif", en: "Taif", ar: "الطائف" },
  { value: "Yanbu", en: "Yanbu", ar: "ينبع" },
  { value: "Rabigh", en: "Rabigh", ar: "رابغ" },
  { value: "Al Kharj", en: "Al Kharj", ar: "الخرج" },
  { value: "Majmaah", en: "Majmaah", ar: "المجمعة" },
  { value: "Dawadmi", en: "Dawadmi", ar: "الدوادمي" },
  { value: "Wadi Al-Dawasir", en: "Wadi Al-Dawasir", ar: "وادي الدواسر" },
];

const index = new Map<string, City>();
for (const c of SAUDI_CITIES) {
  index.set(c.value.toLowerCase(), c);
  index.set(c.en.toLowerCase(), c);
  index.set(c.ar, c);
}

/** Resolve any stored city string (EN or AR) to the label for `lng`. */
export function cityLabel(raw: unknown, lng?: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";
  const hit = index.get(s.toLowerCase()) ?? index.get(s);
  if (!hit) return s;
  return getContentLanguage(lng) === "ar" ? hit.ar : hit.en;
}

/** Cities sorted by the label of the active language. */
export function citiesFor(lng?: unknown): Array<{ value: string; label: string }> {
  const ar = getContentLanguage(lng) === "ar";
  return SAUDI_CITIES.map((c) => ({ value: c.value, label: ar ? c.ar : c.en })).sort((a, b) =>
    a.label.localeCompare(b.label, ar ? "ar" : "en"),
  );
}
