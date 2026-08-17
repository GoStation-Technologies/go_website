import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, MapPin } from "lucide-react";
import stationAsset from "@/assets/station-canopy.jpg.asset.json";

export function JoinCta() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const gradient = isRTL
    ? "linear-gradient(250deg, color-mix(in oklab, var(--ink) 92%, transparent) 0%, color-mix(in oklab, var(--ink) 70%, transparent) 40%, color-mix(in oklab, var(--accent) 28%, transparent) 72%, color-mix(in oklab, var(--accent) 55%, transparent) 100%)"
    : "linear-gradient(110deg, color-mix(in oklab, var(--ink) 92%, transparent) 0%, color-mix(in oklab, var(--ink) 70%, transparent) 40%, color-mix(in oklab, var(--accent) 28%, transparent) 72%, color-mix(in oklab, var(--accent) 55%, transparent) 100%)";

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-hero-ink text-foreground md:mx-6 lg:mx-10">
      <img
        src={stationAsset.url}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full scale-[1.1] object-cover object-[50%_40%] opacity-60"
      />
      <div className="absolute inset-0 bg-ink/60 mix-blend-multiply" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{ background: gradient }}
      />
      <div
        className="absolute inset-0 opacity-20"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-20">
        {/* Text column: naturally starts on the right in RTL, left in LTR */}
        <div className="text-start">
          <div className="eyebrow text-ember-glow">{t("home.ctaBannerEyebrow")}</div>
          <h2 className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {t("home.ctaBanner")}
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-foreground/80 md:text-lg">
            {t("home.ctaBannerText")}
          </p>
        </div>

        {/* Single CTA button centered in its column for visual balance */}
        <div className="flex flex-col items-center sm:flex-row md:items-center md:justify-center">
          <Link
            to="/franchise"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground shadow-glow transition hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(249,115,22,0.35)] sm:w-auto"
          >
            <Handshake className="h-4 w-4" />
            {t("home.ctaRequestAcquisition")}

            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
