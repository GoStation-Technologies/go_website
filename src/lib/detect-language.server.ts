import { getRequestHeader } from "@tanstack/react-start/server";
import { getContentLanguage, getLangFromCookieHeader, type ContentLanguage } from "@/lib/i18n";

export function detectRequestLanguageServer(): ContentLanguage {
  try {
    const fromCookie = getLangFromCookieHeader(getRequestHeader("cookie"));
    if (fromCookie) return fromCookie;
    return getContentLanguage(getRequestHeader("accept-language"));
  } catch {
    return "en";
  }
}
