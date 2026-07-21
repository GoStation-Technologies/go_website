import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { en } from "./locales/en";
import { ar } from "./locales/ar";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { en: { t: en }, ar: { t: ar } },
      fallbackLng: "en",
      supportedLngs: ["en", "ar"],
      defaultNS: "t",
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
        lookupLocalStorage: "gs_lang",
      },
    });
}

export default i18n;
export const isRtl = (lng: string) => lng.startsWith("ar");
