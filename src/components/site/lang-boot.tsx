import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getContentLanguage } from "@/lib/i18n";

/** Syncs <html lang> and <html dir> with the current i18n language. */
export function LangBoot() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);
  return null;
}
