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
import logoAsset from "@/assets/gostation-logo.png.asset.json";
import logoWhiteAsset from "@/assets/gostation-logo-white.png.asset.json";

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
      className={`z-40 w-full transition-all duration-300 ${
        overlay ? "fixed top-0 start-0" : "sticky top-0"
      } ${
        overlayTop
          ? "header-overlay border-b border-transparent bg-transparent"
          : scrolled
            ? `border-b ${overlay ? "header-overlay border-white/10 glass-ink" : "border-border/60 glass"} shadow-[0_1px_0_0_rgba(0,0,0,0.02)]`
            : "border-b border-transparent bg-background/40 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <img
            src={overlay ? logoWhiteAsset.url : logoAsset.url}
            alt="GoStation"
            className="h-9 w-9 object-contain transition-transform duration-500 group-hover:rotate-[8deg]"
          />
          <div className="flex flex-col leading-none">
            <span className="font-display text-[1.05rem] font-bold tracking-tight text-primary">
              {t("brand.name")}
            </span>
            <span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">
              {t("brand.tagline")}
            </span>
          </div>
        </Link>


        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
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


        <div className="flex items-center gap-1.5">
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
            className="hidden h-9 rounded-full bg-accent px-4 text-xs font-semibold text-accent-foreground shadow-glow transition-all hover:scale-[1.02] hover:bg-accent/90 sm:inline-flex"
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
                className="h-9 w-9 rounded-full lg:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-l">
              <SheetHeader className="text-start">
                <SheetTitle className="flex items-center gap-2">
                  <img src={logoAsset.url} alt="" className="h-7 w-7 object-contain" />
                  {t("brand.name")}
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
                  className="mt-4 inline-flex items-center justify-center gap-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-glow"
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
