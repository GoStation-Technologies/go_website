import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

/** Syncs <html lang> and <html dir> with the current i18n language. */
export function LangBoot() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const lng = i18n.language || "en";
    const isAr = lng.startsWith("ar");
    document.documentElement.lang = isAr ? "ar" : "en";
    document.documentElement.dir = isAr ? "rtl" : "ltr";
  }, [i18n.language]);
  return null;
}
