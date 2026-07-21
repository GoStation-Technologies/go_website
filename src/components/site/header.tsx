import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Menu, Globe, Fuel } from "lucide-react";
import { useState } from "react";
import { getContentLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV = [
  { to: "/about", key: "about" },
  { to: "/stations", key: "stations" },
  { to: "/media", key: "media" },
  { to: "/franchise", key: "franchise" },
  { to: "/acquisitions", key: "acquisitions" },
  { to: "/careers", key: "careers" },
  { to: "/investors", key: "investors" },
  { to: "/contact", key: "contact" },
] as const;

export function SiteHeader() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggleLang = () => {
    const next = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar" ? "en" : "ar";
    // Persist so the next SSR render for this visitor uses the chosen language.
    document.cookie = `gs_lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    i18n.changeLanguage(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Fuel className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">{t("brand.name")}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.key}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-accent/10 hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {t(`nav.${n.key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t("common.lang")}</span>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/franchise">{t("home.ctaFranchise")}</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{t("brand.name")}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link
                    key={n.key}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    activeProps={{ className: "bg-muted text-primary" }}
                  >
                    {t(`nav.${n.key}`)}
                  </Link>
                ))}
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md border px-3 py-2 text-sm font-medium"
                >
                  {t("nav.signin")}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
