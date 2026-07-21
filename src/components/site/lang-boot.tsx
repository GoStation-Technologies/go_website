import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

/** Syncs <html lang> and <html dir> with the current i18n language. */
export function LangBoot() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const lng = i18n.language || "en";
    const dir = lng.startsWith("ar") ? "rtl" : "ltr";
    document.documentElement.lang = lng.startsWith("ar") ? "ar" : "en";
    document.documentElement.dir = dir;
  }, [i18n.language]);
  return null;
}
