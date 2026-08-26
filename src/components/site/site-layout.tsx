import type { ReactNode } from "react";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { CookieBanner } from "./cookie-banner";
import { LangBoot } from "./lang-boot";
import { ChatWidget } from "./chat-widget";
import { AnnouncementBar } from "./announcement-bar";

export function SiteLayout({
  children,
  overlayHeader = false,
}: {
  children: ReactNode;
  /** Render the header floating on top of the first section (no bar). */
  overlayHeader?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LangBoot />
      <SiteHeader overlay={overlayHeader} />
      <main>{children}</main>
      <SiteFooter />
      <CookieBanner />
      <ChatWidget />
    </div>
  );
}
