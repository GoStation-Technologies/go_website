import { stationDisplayName, stationStatusLabel } from "./station-status";

export type FallbackStation = {
  name_ar: string; name_en: string; city_ar: string; city_en: string;
  district_ar?: string | null; district_en?: string | null;
  services: string[]; is_active: boolean; status?: string | null;
};
export function normalizeSearch(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
const GROUPS = [
  ["كافيه", "كافى", "قهوة", "مقهى", "cafe", "coffee"],
  ["غسيل", "غسيل سيارات", "car wash", "carwash", "wash"],
  ["صراف", "صراف الي", "atm"],
  ["مطعم", "مطاعم", "restaurant", "restaurants"],
  ["متجر", "متاجر", "بقالة", "تموينات", "store", "retail", "shop", "supermarket"],
].map(group => group.map(normalizeSearch));
const STOP = new Set(["في", "اي", "من", "اين", "محطه", "محطات", "قوستيشن", "عندكم", "يوجد", "هل", "the", "a", "in", "at", "where", "which", "station", "stations", "is", "there", "find", "with"]);
export function matchingStations(message: string, stations: FallbackStation[]) {
  const query = normalizeSearch(message);
  const terms = query.split(" ").filter(term => term.length > 2 && !STOP.has(term));
  const groups = GROUPS.filter(group => group.some(term => query.includes(term)));
  const brand = query.includes("رومانسي") ? ["رومانسي", "romansia", "romansiah"] : [];
  const cities = [...new Set(stations.flatMap(s => [s.city_ar, s.city_en]).map(normalizeSearch).filter(city => city && query.includes(city)))];
  return stations.filter(s => {
    const identity = normalizeSearch([s.name_ar, s.name_en, s.city_ar, s.city_en, s.district_ar, s.district_en].join(" "));
    const services = normalizeSearch((s.services ?? []).join(" "));
    if (cities.length && !cities.some(city => normalizeSearch(`${s.city_ar} ${s.city_en}`).includes(city))) return false;
    // A requested brand must be explicitly recorded, not inferred from 'restaurant'.
    if (brand.length) return brand.some(term => `${identity} ${services}`.includes(term));
    if (groups.length) return groups.every(group => group.some(term => services.includes(term)));
    return terms.some(term => identity.includes(term));
  }).slice(0, 5);
}
export function generalChatFallback(lang: "ar" | "en") {
  return lang === "ar"
    ? "يسعدنا خدمتك! يمكنك تصفح محطاتنا وخدماتنا مباشرة من صفحة المحطات: /stations، أو التواصل مع فريق خدمة العملاء عبر /contact."
    : "We’re happy to help! Browse our stations and services at /stations, or contact customer service at /contact.";
}
export function localChatReply(message: string, lang: "ar" | "en", stations: FallbackStation[] = []) {
  const matches = matchingStations(message, stations);
  if (!matches.length) return generalChatFallback(lang);
  const list = matches.map(s => `- ${stationDisplayName(s, lang === "ar")} — ${lang === "ar" ? s.city_ar : s.city_en}${s.is_active ? "" : ` (${stationStatusLabel(s, lang === "ar")})`}`).join("\n");
  return lang === "ar"
    ? `يمكنك العثور على هذه الخدمة في محطاتنا التالية (راجع حالة المحطة قبل الزيارة):\n${list}\nكما يمكنك تصفح جميع المحطات وخدماتها عبر صفحة المحطات: /stations`
    : `Matching stations (check station status before visiting):\n${list}\nBrowse all stations and services at /stations.`;
}