import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getContentLanguage, getLangFromCookieHeader } from "@/lib/i18n";

/** Syncs <html lang> and <html dir> with the current i18n language. */
export function LangBoot() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const serverLng = getContentLanguage(document.documentElement.lang);
    const cookieLng = getLangFromCookieHeader(document.cookie);
    let storedLng: "en" | "ar" | undefined;
    try {
      const raw = localStorage.getItem("gs_lang");
      if (raw === "en" || raw === "ar") storedLng = raw;
    } catch {
      /* storage unavailable */
    }
    const lng = storedLng ?? cookieLng ?? serverLng;
    if (getContentLanguage(i18n.resolvedLanguage ?? i18n.language) !== lng) {
      i18n.changeLanguage(lng);
    }
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return null;
}
