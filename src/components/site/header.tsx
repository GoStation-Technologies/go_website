import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Menu, Globe, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getContentLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CompanyLogo } from "@/components/site/company-logo";

import { ThemeToggle } from "@/components/theme-toggle";
import { AccessibilityMenu } from "@/components/site/accessibility-menu";

const NAV = [
  { to: "/about", key: "about" },
  { to: "/stations", key: "stations" },
  { to: "/franchise", key: "franchise" },
  { to: "/acquisitions", key: "acquisitions" },
  { to: "/investors", key: "investors" },
  { to: "/media", key: "media" },
  { to: "/careers", key: "careers" },
  { to: "/contact", key: "contact" },
] as const;



export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleLang = () => {
    const next = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar" ? "en" : "ar";
    // Persist the choice. Inside cross-site preview iframes a `lax` cookie is
    // dropped by the browser, so use `none; secure` on https and keep a
    // localStorage copy as a fallback source of truth.
    const crossSiteSafe = typeof location !== "undefined" && location.protocol === "https:";
    document.cookie = `gs_lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=${
      crossSiteSafe ? "none; secure" : "lax"
    }`;
    try {
      localStorage.setItem("gs_lang", next);
    } catch {
      /* storage unavailable */
    }
    i18n.changeLanguage(next);
  };


  const overlayTop = overlay && !scrolled;

  return (
    <header
      className={`${open ? "z-40" : "z-[1100]"} w-full transition-colors duration-200 ${
        overlay ? "fixed top-0 start-0" : "sticky top-0"
      } ${
        overlayTop
          ? "header-overlay border-b border-transparent bg-ink"
          : scrolled
            ? `border-b ${overlay ? "header-overlay border-border bg-ink" : "border-border/60 glass"} shadow-[0_1px_0_0_rgba(0,0,0,0.02)]`
            : "border-b border-transparent bg-background/40 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] flex-col items-center justify-between gap-2 px-4 py-3 rtl:items-end sm:flex-row sm:items-center sm:gap-3 sm:px-6 sm:py-0">
        <Link to="/" className="max-w-full shrink-0" aria-label={t("brand.name")}>
          <CompanyLogo inverse={overlay} />
        </Link>


        <nav className="hidden flex-1 items-center justify-center gap-0.5 min-[1440px]:flex">
          {NAV.map((n) => (
            <Link
              key={n.key}
              to={n.to}
              className="relative whitespace-nowrap rounded-full px-2 py-2 text-[12px] font-medium text-foreground/70 transition hover:text-foreground xl:px-3 xl:text-[13px] after:absolute after:bottom-1 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-accent after:transition-all hover:after:w-[70%]"
              activeProps={{
                className: "text-primary bg-primary/5",
              }}
            >
              {t(`nav.${n.key}`)}
            </Link>
          ))}
        </nav>


        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <AccessibilityMenu />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="h-9 gap-1.5 rounded-full text-xs font-semibold"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{t("common.lang")}</span>
          </Button>
          <Button
            asChild
            size="sm"
            className="hidden h-9 rounded-full bg-accent px-4 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90 min-[1100px]:inline-flex"
          >
            <Link to="/franchise">
              {t("nav.franchiseCta")}
              <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full min-[1440px]:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[360px] max-w-full border-l p-4 sm:p-6">
              <SheetHeader className="text-start">
                <SheetTitle className="pt-6">
                  <CompanyLogo />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-0.5">
                {NAV.map((n) => (
                  <Link
                    key={n.key}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "bg-primary/10 text-primary" }}
                  >
                    {t(`nav.${n.key}`)}
                  </Link>
                ))}
                <Link
                  to="/franchise"
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex items-center justify-center gap-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
                >
                  {t("nav.franchiseCta")}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
