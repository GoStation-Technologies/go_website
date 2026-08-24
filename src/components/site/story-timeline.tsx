import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStationStats } from "@/hooks/use-station-stats";
import { ChevronLeft, ChevronRight, Flag, Fuel, MapPin, Smartphone, Rocket, Trophy } from "lucide-react";
import stationCanopy from "@/assets/station-canopy.jpg.asset.json";
import pylon from "@/assets/gostation-pylon.jpg.asset.json";
import franchiseStation from "@/assets/franchise-station.jpg.asset.json";
import appDownload from "@/assets/go-app-download.jpg.asset.json";
import heroCinematic from "@/assets/hero-cinematic.jpg.asset.json";

const MILESTONES = [
  { key: "m1", year: "2016", icon: Flag, img: pylon.url },
  { key: "m2", year: "2018", icon: Fuel, img: stationCanopy.url },
  { key: "m3", year: "2020", icon: MapPin, img: franchiseStation.url },
  { key: "m4", year: "2022", icon: Smartphone, img: appDownload.url },
  { key: "m5", year: "2024", icon: Rocket, img: heroCinematic.url },
  { key: "m6", year: "2026", icon: Trophy, img: stationCanopy.url },
] as const;

export function StoryTimeline() {
  const { t } = useTranslation();
  const { stationsCount, activeRegionsCount } = useStationStats();
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setProgress(max > 0 ? Math.min(1, pos / max) : 1);
    const card = el.clientWidth / Math.max(1, MILESTONES.length);
    setActive(Math.round((pos / Math.max(1, max)) * (MILESTONES.length - 1)));
    void card;
  }, []);

  useEffect(() => {
    onScroll();
  }, [onScroll]);

  const nudge = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * Math.min(420, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border bg-card p-6 md:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background:radial-gradient(60%_80%_at_80%_0%,var(--color-accent),transparent_60%),radial-gradient(60%_80%_at_10%_100%,var(--color-primary),transparent_60%)]"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
            {t("about.journey.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{t("about.journey.title")}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("about.journey.lead")}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={t("about.journey.prev")}
            onClick={() => nudge(-1)}
            className="grid h-10 w-10 place-items-center rounded-full border bg-background text-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronRight className="h-5 w-5 rtl:hidden" style={{ transform: "rotate(180deg)" }} />
            <ChevronLeft className="hidden h-5 w-5 rtl:block" style={{ transform: "rotate(180deg)" }} />
          </button>
          <button
            type="button"
            aria-label={t("about.journey.next")}
            onClick={() => nudge(1)}
            className="grid h-10 w-10 place-items-center rounded-full border bg-background text-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronRight className="h-5 w-5 rtl:hidden" />
            <ChevronLeft className="hidden h-5 w-5 rtl:block" />
          </button>
        </div>
      </div>

      {/* progress rail */}
      <div className="relative mt-8 h-1 w-full rounded-full bg-muted">
        <div
          className="h-1 rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-200"
          style={{ width: `${Math.max(8, progress * 100)}%` }}
        />
      </div>

      <div
        ref={railRef}
        onScroll={onScroll}
        className="relative -mx-2 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {MILESTONES.map((m, i) => {
          const Icon = m.icon;
          const isActive = i === active;
          return (
            <article
              key={m.key}
              className={`group relative w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl border bg-background transition-all duration-300 sm:w-[300px] ${
                isActive ? "border-accent/60 shadow-elegant" : "hover:border-accent/40"
              }`}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={m.img}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute bottom-3 start-4 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-display text-2xl font-extrabold tracking-tight">{m.year}</span>
                </div>
              </div>
              <div className="relative p-5">
                <span
                  aria-hidden
                  className={`absolute -top-[7px] start-6 h-3 w-3 rotate-45 rounded-[3px] transition-colors ${
                    isActive ? "bg-accent" : "bg-border"
                  }`}
                />
                <h3 className="font-bold">{t(`about.journey.${m.key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`about.journey.${m.key}.body`, { stations: stationsCount, regions: activeRegionsCount })}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
