import type { ReactNode } from "react";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { CookieBanner } from "./cookie-banner";
import { LangBoot } from "./lang-boot";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LangBoot />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <CookieBanner />
    </div>
  );
}
