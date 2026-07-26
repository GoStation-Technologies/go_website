/**
 * Locale helpers that keep the UI text in Arabic while forcing Western
 * (Latin) digits everywhere — never Eastern Arabic numerals (١٢٣).
 */
export function digitLocale(lang?: string | null): string {
  const l = (lang ?? "en").toLowerCase();
  // ar-EG uses the Gregorian calendar + Arabic month names; -u-nu-latn forces 1,2,3.
  return l.startsWith("ar") ? "ar-EG-u-nu-latn" : "en-US";
}

export function fmtNumber(value: number, lang?: string | null): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(digitLocale(lang)).format(value);
}

export function fmtDateTime(value: string | number | Date, lang?: string | null): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(digitLocale(lang));
}

export function fmtDate(
  value: string | number | Date,
  lang?: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(digitLocale(lang), options);
}
