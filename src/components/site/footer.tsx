import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Instagram, Twitter, Linkedin, ArrowUpRight, MapPin, Mail } from "lucide-react";
import logoAsset from "@/assets/gostation-logo-white.png.asset.json";
import isoLogo from "@/assets/iso-logo.png.asset.json";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="relative mt-24 overflow-hidden bg-hero-ink text-foreground">
      <div className="absolute inset-0 bg-grid-ink opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 end-0 h-96 w-96 rounded-full bg-ember opacity-20 blur-3xl animate-pulse-glow"
        aria-hidden
      />




      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logoAsset.url} alt="GoStation" className="h-11 w-11 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold">{t("brand.name")}</span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/75">
                {t("brand.tagline")}
              </span>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-foreground/85">
            {t("footer.tagline")}
          </p>
          <div className="mt-5 flex items-start gap-2 text-sm text-foreground/90">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember-glow" />
            <span>{t("contact.address")}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-foreground/90">
            <Mail className="h-4 w-4 shrink-0 text-ember-glow" />
            <a href="mailto:info@gostation.net" className="hover:text-ember-glow">info@gostation.net</a>
          </div>
          <div className="mt-6 flex gap-2">
            {[Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-foreground/90 transition hover:border-ember-glow hover:bg-ember/20 hover:text-ember-glow"
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
          <li className="text-foreground/80">{t("footer.privacy")}</li>
          <li className="text-foreground/80">{t("footer.terms")}</li>
          <li className="text-foreground/80">{t("contact.hours")}</li>
        </FooterColumn>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-8 md:justify-end">
          {[
            { code: "9001:2015", label: t("footer.cert9001") },
            { code: "10002:2018", label: t("footer.cert10002") },
            { code: "14001:2015", label: t("footer.cert14001") },
            { code: "45001:2018", label: t("footer.cert45001") },
          ].map((c) => (
            <div key={c.code} className="group flex w-28 flex-col items-center text-center">
              <img
                src={isoLogo.url}
                alt={`ISO ${c.code} — ${c.label}`}
                loading="lazy"
                className="h-12 w-auto opacity-70 brightness-0 invert transition duration-300 group-hover:opacity-100 group-hover:-translate-y-0.5"
              />
              <div
                dir="ltr"
                className="mt-3 font-display text-sm font-bold tracking-tight text-foreground"
              >
                {c.code}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-foreground/60">{c.label}</div>
            </div>
          ))}
        </div>
      </div>



      <div className="relative border-t border-white/10">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-foreground/75 sm:flex-row sm:px-6">
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
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
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
        className="inline-flex items-center gap-1 text-foreground/85 transition hover:text-ember-glow hover:underline underline-offset-4"
      >
        {children}
      </Link>
    </li>
  );
}
