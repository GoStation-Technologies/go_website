import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Check } from "lucide-react";
import stationAsset from "@/assets/station-canopy.jpg.asset.json";

export function JoinCta() {
  const { t } = useTranslation();
  const points = [t("footer.acqPoint1"), t("footer.acqPoint2"), t("footer.acqPoint3")];
  return (
    <section className="relative overflow-hidden bg-hero-ink text-foreground">
      <img
        src={stationAsset.url}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full scale-[1.65] object-cover object-[70%_38%] opacity-60"
      />
      <div className="absolute inset-0 bg-ink/55 mix-blend-multiply" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(100deg, color-mix(in oklab, var(--ink) 94%, transparent) 0%, color-mix(in oklab, var(--ink) 82%, transparent) 38%, color-mix(in oklab, var(--ink) 45%, transparent) 62%, color-mix(in oklab, var(--ink) 12%, transparent) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--ink) 70%, transparent) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-grid-ink opacity-15" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.35fr_1fr] md:items-center">
          <div>
            <div className="eyebrow text-ember-glow">{t("footer.eyebrow")}</div>
            <h2 className="mt-4 max-w-2xl text-balance text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              {t("footer.headline")}
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-foreground/75 md:text-lg">
              {t("footer.acqBody")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-md md:p-7">
            <ul className="space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-foreground/85">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/acquisitions"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-glow transition hover:scale-[1.02]"
              >
                {t("footer.acqCta")}
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
      </div>
    </section>
  );
}
