import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getContentLanguage } from "@/lib/i18n";

/** Syncs <html lang> and <html dir> with the current i18n language.
 *
 * The i18n instance is created with the server-detected language, so this
 * component only updates the HTML attributes to match it. It does NOT
 * re-derive the language from localStorage/cookie to avoid overriding the
 * server-rendered language and causing a hydration/content mismatch.
 */
export function LangBoot() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
    if (document.documentElement.lang !== lng) {
      document.documentElement.lang = lng;
    }
    const dir = lng === "ar" ? "rtl" : "ltr";
    if (document.documentElement.dir !== dir) {
      document.documentElement.dir = dir;
    }
  }, [i18n.language, i18n.resolvedLanguage]);

  return null;
}
