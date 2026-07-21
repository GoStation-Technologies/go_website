import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { routeTree } from "./routeTree.gen";
import { getLangFromCookieHeader, type ContentLanguage } from "@/lib/i18n";

const detectRequestLanguage = createIsomorphicFn()
  .client((): ContentLanguage => {
    const fromCookie = getLangFromCookieHeader(document.cookie);
    return fromCookie ?? "en";
  })
  .server((): ContentLanguage => {
    // Lazy require so the server-only module never enters the client graph.
    const { detectRequestLanguageServer } = require("@/lib/detect-language.server") as typeof import("@/lib/detect-language.server");
    return detectRequestLanguageServer();
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
