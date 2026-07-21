import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Fuel, Instagram, Twitter, Linkedin } from "lucide-react";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mt-24 border-t bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Fuel className="h-5 w-5" />
            </span>
            {t("brand.name")}
          </div>
          <p className="mt-3 text-sm text-primary-foreground/70">{t("footer.tagline")}</p>
          <div className="mt-4 flex gap-3 text-primary-foreground/70">
            <a href="#" aria-label="Twitter"><Twitter className="h-5 w-5" /></a>
            <a href="#" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground/60">{t("footer.company")}</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-accent">{t("nav.about")}</Link></li>
            <li><Link to="/careers" className="hover:text-accent">{t("nav.careers")}</Link></li>
            <li><Link to="/media" className="hover:text-accent">{t("nav.media")}</Link></li>
            <li><Link to="/investors" className="hover:text-accent">{t("nav.investors")}</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground/60">{t("footer.resources")}</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/stations" className="hover:text-accent">{t("nav.stations")}</Link></li>
            <li><Link to="/franchise" className="hover:text-accent">{t("nav.franchise")}</Link></li>
            <li><Link to="/acquisitions" className="hover:text-accent">{t("nav.acquisitions")}</Link></li>
            <li><Link to="/contact" className="hover:text-accent">{t("nav.contact")}</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground/60">{t("footer.legal")}</div>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li>{t("footer.privacy")}</li>
            <li>{t("footer.terms")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {t("brand.name")} — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
