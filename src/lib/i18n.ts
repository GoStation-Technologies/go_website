import { createInstance, type i18n as I18n } from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { ar } from "./locales/ar";

export type ContentLanguage = "en" | "ar";

export const getContentLanguage = (lng?: unknown): ContentLanguage =>
  typeof lng === "string" && lng.toLowerCase().startsWith("ar") ? "ar" : "en";

export const isRtl = (lng?: unknown) => getContentLanguage(lng) === "ar";

const resources = { en: { t: en }, ar: { t: ar } };

/**
 * Build a fresh i18next instance for the given language. Called once per
 * request during SSR (so different requests can render different languages
 * without sharing mutable singleton state) and once on the client during
 * hydration with the same language the server rendered.
 */
export function createI18nInstance(lng: ContentLanguage): I18n {
  const instance = createInstance();
  instance.use(initReactI18next).init({
    lng,
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "ar"],
    defaultNS: "t",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}

export const LANG_COOKIE = "gs_lang";

/** Parse `gs_lang` out of a Cookie header value. */
export function getLangFromCookieHeader(cookieHeader: string | null | undefined): ContentLanguage | undefined {
  if (typeof cookieHeader !== "string" || cookieHeader.length === 0) return undefined;
  const m = cookieHeader.match(/(?:^|;\s*)gs_lang=([^;]+)/);
  if (!m) return undefined;
  try {
    return getContentLanguage(decodeURIComponent(m[1]));
  } catch {
    return getContentLanguage(m[1]);
  }
}
