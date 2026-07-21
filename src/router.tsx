import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { routeTree } from "./routeTree.gen";
import { getContentLanguage, getLangFromCookieHeader, type ContentLanguage } from "@/lib/i18n";
import { getRequestHeader } from "@tanstack/react-start/server";

const detectRequestLanguage = createIsomorphicFn()
  .client((): ContentLanguage => {
    const fromCookie = getLangFromCookieHeader(document.cookie);
    return fromCookie ?? "en";
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
