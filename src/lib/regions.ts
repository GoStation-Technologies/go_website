/**
 * Saudi administrative regions used by the station map filter. Cities are
 * mapped by their canonical English name (also matched case-insensitively
 * against the Arabic name stored on a station row).
 */
export type Region = { value: string; en: string; ar: string; cities: string[] };

export const SAUDI_REGIONS: Region[] = [
  {
    value: "riyadh",
    en: "Riyadh Region",
    ar: "منطقة الرياض",
    cities: ["Riyadh", "Al Kharj", "Majmaah", "Dawadmi", "Wadi Al-Dawasir", "الرياض", "الخرج", "المجمعة", "الدوادمي", "وادي الدواسر"],
  },
  {
    value: "makkah",
    en: "Makkah Region",
    ar: "منطقة مكة المكرمة",
    cities: ["Jeddah", "Makkah", "Taif", "Rabigh", "جدة", "مكة", "مكة المكرمة", "الطائف", "رابغ"],
  },
  {
    value: "madinah",
    en: "Madinah Region",
    ar: "منطقة المدينة المنورة",
    cities: ["Madinah", "Yanbu", "المدينة", "المدينة المنورة", "ينبع"],
  },
  {
    value: "eastern",
    en: "Eastern Province",
    ar: "المنطقة الشرقية",
    cities: [
      "Dammam", "Khobar", "Dhahran", "Jubail", "Khafji", "Hafar Al-Batin", "Qatif", "Ahsa", "Al-Ahsa",
      "الدمام", "الخبر", "الظهران", "الجبيل", "الخفجي", "حفر الباطن", "القطيف", "الأحساء",
    ],
  },
  { value: "qassim", en: "Qassim Region", ar: "منطقة القصيم", cities: ["Buraydah", "Unaizah", "بريدة", "عنيزة"] },
  { value: "hail", en: "Hail Region", ar: "منطقة حائل", cities: ["Hail", "حائل"] },
  { value: "tabuk", en: "Tabuk Region", ar: "منطقة تبوك", cities: ["Tabuk", "تبوك"] },
  { value: "northern", en: "Northern Borders", ar: "الحدود الشمالية", cities: ["Arar", "عرعر"] },
  { value: "jouf", en: "Al Jouf Region", ar: "منطقة الجوف", cities: ["Sakaka", "سكاكا"] },
  { value: "jazan", en: "Jazan Region", ar: "منطقة جازان", cities: ["Jazan", "جازان"] },
  { value: "asir", en: "Asir Region", ar: "منطقة عسير", cities: ["Abha", "Khamis Mushait", "Bisha", "أبها", "خميس مشيط", "بيشة"] },
  { value: "najran", en: "Najran Region", ar: "منطقة نجران", cities: ["Najran", "نجران"] },
  { value: "baha", en: "Al Baha Region", ar: "منطقة الباحة", cities: ["Al Baha", "الباحة"] },
];

const cityToRegion = new Map<string, string>();
for (const r of SAUDI_REGIONS) {
  for (const c of r.cities) cityToRegion.set(c.trim().toLowerCase(), r.value);
}

/** Resolve a station's region key from its English/Arabic city names. */
export function regionForCity(...cities: Array<string | null | undefined>): string | null {
  for (const c of cities) {
    const hit = c ? cityToRegion.get(c.trim().toLowerCase()) : undefined;
    if (hit) return hit;
  }
  return null;
}

export function regionLabel(value: string, ar: boolean): string {
  const r = SAUDI_REGIONS.find((x) => x.value === value);
  return r ? (ar ? r.ar : r.en) : value;
}

/** Human label for a stored fuel type code. */
export function fuelLabel(code: string, ar: boolean): string {
  const map: Record<string, [string, string]> = {
    "91": ["Gasoline 91", "بنزين 91"],
    "95": ["Gasoline 95", "بنزين 95"],
    "98": ["Gasoline 98", "بنزين 98"],
    diesel: ["Diesel", "ديزل"],
  };
  const hit = map[code.toLowerCase()];
  return hit ? (ar ? hit[1] : hit[0]) : code;
}
