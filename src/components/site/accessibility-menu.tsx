import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Accessibility,
  Contrast,
  ALargeSmall,
  Link2,
  Type,
  ImageOff,
  PauseCircle,
  MousePointer2,
  AlignVerticalSpaceAround,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getContentLanguage } from "@/lib/i18n";

const STORAGE_KEY = "gs_a11y";

type Settings = {
  contrast: boolean;
  textScale: number; // 0..3
  spacing: boolean;
  links: boolean;
  dyslexia: boolean;
  hideImages: boolean;
  stopAnimations: boolean;
  bigCursor: boolean;
};

const DEFAULTS: Settings = {
  contrast: false,
  textScale: 0,
  spacing: false,
  links: false,
  dyslexia: false,
  hideImages: false,
  stopAnimations: false,
  bigCursor: false,
};

function apply(s: Settings) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("a11y-contrast", s.contrast);
  el.classList.toggle("a11y-spacing", s.spacing);
  el.classList.toggle("a11y-links", s.links);
  el.classList.toggle("a11y-dyslexia", s.dyslexia);
  el.classList.toggle("a11y-no-images", s.hideImages);
  el.classList.toggle("a11y-no-anim", s.stopAnimations);
  el.classList.toggle("a11y-cursor", s.bigCursor);
  el.style.setProperty("--a11y-text-scale", String(1 + s.textScale * 0.1));
}

const LABELS = {
  en: {
    title: "Accessibility menu",
    open: "Accessibility options",
    contrast: "High contrast",
    text: "Text size",
    spacing: "Text spacing",
    links: "Highlight links",
    dyslexia: "Readable font",
    images: "Hide images",
    anim: "Stop animations",
    cursor: "Big cursor",
    reset: "Reset all",
  },
  ar: {
    title: "قائمة الوصول",
    open: "خيارات إمكانية الوصول",
    contrast: "تباين عالٍ",
    text: "تكبير النص",
    spacing: "تباعد النص",
    links: "إبراز الروابط",
    dyslexia: "خط سهل القراءة",
    images: "إخفاء الصور",
    anim: "إيقاف الحركات",
    cursor: "مؤشر كبير",
    reset: "إعادة الضبط",
  },
} as const;

export function AccessibilityMenu({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const L = LABELS[getContentLanguage(i18n.resolvedLanguage ?? i18n.language)];
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const next = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
        setS(next);
        apply(next);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setS((prev) => {
      const next = { ...prev, ...patch };
      apply(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const tiles: { key: keyof Settings | "text"; label: string; icon: typeof Contrast; active: boolean; onClick: () => void; hint?: string }[] = [
    { key: "contrast", label: L.contrast, icon: Contrast, active: s.contrast, onClick: () => update({ contrast: !s.contrast }) },
    {
      key: "text",
      label: L.text,
      icon: ALargeSmall,
      active: s.textScale > 0,
      onClick: () => update({ textScale: (s.textScale + 1) % 4 }),
      hint: s.textScale > 0 ? `+${s.textScale * 10}%` : undefined,
    },
    { key: "spacing", label: L.spacing, icon: AlignVerticalSpaceAround, active: s.spacing, onClick: () => update({ spacing: !s.spacing }) },
    { key: "links", label: L.links, icon: Link2, active: s.links, onClick: () => update({ links: !s.links }) },
    { key: "dyslexia", label: L.dyslexia, icon: Type, active: s.dyslexia, onClick: () => update({ dyslexia: !s.dyslexia }) },
    { key: "hideImages", label: L.images, icon: ImageOff, active: s.hideImages, onClick: () => update({ hideImages: !s.hideImages }) },
    { key: "stopAnimations", label: L.anim, icon: PauseCircle, active: s.stopAnimations, onClick: () => update({ stopAnimations: !s.stopAnimations }) },
    { key: "bigCursor", label: L.cursor, icon: MousePointer2, active: s.bigCursor, onClick: () => update({ bigCursor: !s.bigCursor }) },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={L.open}
          className={`h-9 w-9 rounded-full ${className ?? ""}`}
        >
          <Accessibility className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[19rem] p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{L.title}</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-full text-[11px]"
            onClick={() => {
              apply(DEFAULTS);
              setS(DEFAULTS);
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                /* ignore */
              }
            }}
          >
            <RotateCcw className="h-3 w-3" />
            {L.reset}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.key}
                type="button"
                aria-pressed={tile.active}
                onClick={tile.onClick}
                className={`flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center transition ${
                  tile.active
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border/70 bg-muted/40 text-foreground/80 hover:bg-muted"
                }`}
              >
                <Icon className={`h-5 w-5 ${tile.active ? "text-accent" : "text-foreground/70"}`} />
                <span className="text-[11px] font-medium leading-tight">{tile.label}</span>
                {tile.hint ? (
                  <span className="text-[10px] font-semibold text-accent">{tile.hint}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
