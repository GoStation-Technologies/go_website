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
      const cookieHeader = getRequestHeader("cookie");
      const fromCookie = getLangFromCookieHeader(cookieHeader);
      if (fromCookie) {
        console.log("[ssr] lang from cookie:", fromCookie);
        return fromCookie;
      }
      const acceptLang = getRequestHeader("accept-language");
      const fromAccept = getContentLanguage(acceptLang);
      console.log("[ssr] lang from accept-language:", fromAccept, acceptLang);
      return fromAccept;
    } catch (e) {
      console.log("[ssr] lang error:", e);
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
