import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import stationAsset from "@/assets/station-canopy.jpg.asset.json";

export function JoinCta() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-hero-ink text-foreground">
      <img
        src={stationAsset.url}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-ink/80 mix-blend-multiply" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, color-mix(in oklab, var(--ink) 92%, transparent) 0%, color-mix(in oklab, var(--ink) 70%, transparent) 55%, color-mix(in oklab, var(--ink) 45%, transparent) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-grid-ink opacity-25" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
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
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foreground/90 transition hover:border-white/50 hover:bg-white/5"
            >
              {t("nav.contact")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
