import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { DirectionProvider } from "@radix-ui/react-direction";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { createI18nInstance, isRtl, type ContentLanguage } from "@/lib/i18n";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  lang: ContentLanguage;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GoStation — A station and more" },
      { name: "description", content: "The fastest-growing fuel network in Saudi Arabia — live fuel prices, franchise opportunities, and a full station experience." },
      { name: "theme-color", content: "#002B49" },
      { property: "og:title", content: "GoStation — A station and more" },
      { property: "og:description", content: "The fastest-growing fuel network in Saudi Arabia — live fuel prices, franchise opportunities, and a full station experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "GoStation — A station and more" },
      { name: "twitter:description", content: "The fastest-growing fuel network in Saudi Arabia — live fuel prices, franchise opportunities, and a full station experience." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1fda0e7f-ceba-4d6b-bedb-10ff02e8e432/id-preview-f53b5882--c1862ef1-c082-4ae4-9879-6f18d23db5e4.lovable.app-1784669419270.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1fda0e7f-ceba-4d6b-bedb-10ff02e8e432/id-preview-f53b5882--c1862ef1-c082-4ae4-9879-6f18d23db5e4.lovable.app-1784669419270.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/__l5e/assets-v1/e22eb28f-a690-4eea-b030-32305f54d4eb/gostation-logo.png" },
      { rel: "apple-touch-icon", href: "/__l5e/assets-v1/e22eb28f-a690-4eea-b030-32305f54d4eb/gostation-logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "GoStation",
          url: "https://org-story-weaver.lovable.app",
          description:
            "The fastest-growing fuel station network in Saudi Arabia — fuel, retail, fleet services and franchise opportunities.",
          areaServed: "SA",
          contactPoint: [
            { "@type": "ContactPoint", contactType: "customer service", email: "contact@gostation.net", telephone: "+966920000000" },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { lang } = Route.useRouteContext();
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, lang } = Route.useRouteContext();
  // One i18next instance per request on the server; recreated on the client
  // only if the negotiated language changes (normally never — hydration uses
  // the same cookie-derived lang the server used).
  const i18n = useMemo(() => createI18nInstance(lang), [lang]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n} defaultNS="t">
        <AppDirection>
          <Outlet />
          <Toaster />
        </AppDirection>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

/**
 * Radix primitives default to `dir="ltr"` unless a DirectionProvider is present,
 * which forced LTR bidi (misplaced Arabic punctuation) inside Tabs, Dialogs and
 * other portalled subtrees even when <html dir="rtl">. This keeps every Radix
 * subtree in sync with the active i18n language.
 */
function AppDirection({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const dir = isRtl(i18n.resolvedLanguage ?? i18n.language) ? "rtl" : "ltr";
  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}
