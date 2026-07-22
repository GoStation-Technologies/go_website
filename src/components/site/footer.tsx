import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Instagram, Twitter, Linkedin, ArrowUpRight, MapPin, Mail } from "lucide-react";
import logoAsset from "@/assets/gostation-logo.png.asset.json";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="relative mt-24 overflow-hidden bg-hero-ink text-primary-foreground">
      <div className="absolute inset-0 bg-grid-ink opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 end-0 h-96 w-96 rounded-full bg-ember opacity-20 blur-3xl animate-pulse-glow"
        aria-hidden
      />

      {/* CTA strip */}
      <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="grid gap-8 border-b border-white/10 pb-16 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <div className="eyebrow text-ember-glow">{t("footer.eyebrow")}</div>
            <h2 className="mt-4 max-w-2xl text-balance text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              {t("footer.headline")}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              to="/franchise"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-glow transition hover:scale-[1.02]"
            >
              {t("home.ctaFranchise")}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-primary-foreground/90 transition hover:border-white/50 hover:bg-white/5"
            >
              {t("nav.contact")}
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logoAsset.url} alt="GoStation" className="h-11 w-11" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold">{t("brand.name")}</span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/60">
                {t("brand.tagline")}
              </span>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
            {t("footer.tagline")}
          </p>
          <div className="mt-5 flex items-start gap-2 text-sm text-primary-foreground/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember-glow" />
            <span>{t("contact.address")}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-primary-foreground/80">
            <Mail className="h-4 w-4 shrink-0 text-ember-glow" />
            <a href="mailto:info@gostation.net" className="hover:text-ember-glow">info@gostation.net</a>
          </div>
          <div className="mt-6 flex gap-2">
            {[Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-primary-foreground/80 transition hover:border-ember hover:bg-ember/10 hover:text-ember"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title={t("footer.company")}>
          <FooterLink to="/about">{t("nav.about")}</FooterLink>
          <FooterLink to="/careers">{t("nav.careers")}</FooterLink>
          <FooterLink to="/media">{t("nav.media")}</FooterLink>
          <FooterLink to="/investors">{t("nav.investors")}</FooterLink>
        </FooterColumn>
        <FooterColumn title={t("footer.resources")}>
          <FooterLink to="/stations">{t("nav.stations")}</FooterLink>
          <FooterLink to="/franchise">{t("nav.franchise")}</FooterLink>
          <FooterLink to="/acquisitions">{t("nav.acquisitions")}</FooterLink>
          <FooterLink to="/contact">{t("nav.contact")}</FooterLink>
        </FooterColumn>
        <FooterColumn title={t("footer.legal")}>
          <li className="text-primary-foreground/70">{t("footer.privacy")}</li>
          <li className="text-primary-foreground/70">{t("footer.terms")}</li>
          <li className="text-primary-foreground/70">{t("contact.hours")}</li>
        </FooterColumn>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-primary-foreground/60 sm:flex-row sm:px-6">
          <div>© {new Date().getFullYear()} {t("brand.name")} — {t("footer.rights")}</div>
          <div className="tracking-[0.18em]">{t("footer.microcopy")}</div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
        {title}
      </div>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to as never}
        className="inline-flex items-center gap-1 text-primary-foreground/80 transition hover:text-ember"
      >
        {children}
      </Link>
    </li>
  );
}
