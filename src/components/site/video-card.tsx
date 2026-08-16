import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Play, Eye } from "lucide-react";
import { getContentLanguage } from "@/lib/i18n";

export type VideoItem = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  cover_url?: string | null;
  views_count?: number | null;
  duration_seconds?: number | null;
};

function formatViews(n: number, lng: string) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}${lng === "ar" ? "M" : "M"}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function VideoCard({ video, className = "" }: { video: VideoItem; className?: string }) {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const title = lng === "ar" ? video.title_ar : video.title_en;
  const views = video.views_count ?? 0;

  return (
    <Link to="/media/$slug" params={{ slug: video.slug }} className={`group block ${className}`}>
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant">
        <div className="relative aspect-video overflow-hidden bg-primary">
          {video.cover_url ? (
            <img
              src={video.cover_url}
              alt={title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent/60" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

          {/* play button */}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-accent/95 text-accent-foreground shadow-glow ring-4 ring-white/25 transition duration-300 group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-[2px] fill-current rtl:-scale-x-100" />
            </span>
          </span>

          {typeof video.duration_seconds === "number" && video.duration_seconds > 0 && (
            <span className="absolute bottom-3 end-3 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
              {formatDuration(video.duration_seconds)}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="line-clamp-2 font-display text-base font-bold leading-snug transition group-hover:text-accent">
            {title}
          </h3>
          <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="tabular-nums">{formatViews(views, lng)}</span>
            {t("media.views")}
          </span>
        </div>
      </article>
    </Link>
  );
}
