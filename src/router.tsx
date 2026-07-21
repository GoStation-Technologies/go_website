import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { getContentLanguage, getLangFromCookieHeader, type ContentLanguage } from "@/lib/i18n";

// Statically imported so the framework's dev/prod bundlers can resolve it,
// but only *called* on the server (guarded by `typeof document`).
import { getRequestHeader } from "@tanstack/react-start/server";

function detectRequestLanguage(): ContentLanguage {
  // Client: read from the document cookie so hydration matches SSR.
  if (typeof document !== "undefined") {
    const fromCookie = getLangFromCookieHeader(document.cookie);
    return fromCookie ?? "en";
  }
  // Server: prefer the language cookie, fall back to Accept-Language.
  try {
    const fromCookie = getLangFromCookieHeader(getRequestHeader("cookie"));
    if (fromCookie) return fromCookie;
    return getContentLanguage(getRequestHeader("accept-language"));
  } catch {
    return "en";
  }
}

export const getRouter = () => {
  const queryClient = new QueryClient();
  const lang = detectRequestLanguage();

  const router = createRouter({
    routeTree,
    context: { queryClient, lang },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
