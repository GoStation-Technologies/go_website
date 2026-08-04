import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  children: ReactNode;
  /** rough width of one card in px, used for the scroll step */
  step?: number;
};

/**
 * Horizontal snap-scrolling rail with RTL-aware prev / next arrows.
 */
export function MediaCarousel({ children, step = 380 }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // scrollLeft is negative (or reversed) in RTL depending on engine — normalize
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setAtStart(pos <= 4);
    setAtEnd(pos >= max - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: step * dir * (rtl ? -1 : 1), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <div className="mt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={atStart}
          aria-label={t("media.prev")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-accent hover:text-accent disabled:opacity-35"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={atEnd}
          aria-label={t("media.next")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-accent hover:text-accent disabled:opacity-35"
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
