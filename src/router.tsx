import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { routeTree } from "./routeTree.gen";
import { getContentLanguage, getLangFromCookieHeader, type ContentLanguage } from "@/lib/i18n";
import { getRequestHeader } from "@tanstack/react-start/server";

const detectRequestLanguage = createIsomorphicFn()
  .client((): ContentLanguage => {
    // Match the server-rendered HTML lang during hydration to avoid a
    // language mismatch in environments where the server cannot see the
    // browser cookie. The cookie will be applied after hydration.
    const htmlLang =
      typeof document !== "undefined" && document.documentElement.lang
        ? getContentLanguage(document.documentElement.lang)
        : undefined;
    const fromCookie = getLangFromCookieHeader(document.cookie);
    return htmlLang ?? fromCookie ?? "en";
  })
  .server((): ContentLanguage => {
    try {
      const fromCookie = getLangFromCookieHeader(getRequestHeader("cookie"));
      if (fromCookie) return fromCookie;
      return getContentLanguage(getRequestHeader("accept-language"));
    } catch {
      return "en";
    }
  });

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
