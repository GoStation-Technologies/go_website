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
  Droplet,
  AlignLeft,
  MoveVertical,
  Info,
  Layers,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  saturation: number; // 0 off, 1 low, 2 grayscale
  lineHeight: boolean;
  align: number; // 0 off, 1 start, 2 center
  tooltips: boolean;
  readingGuide: boolean;
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
  saturation: 0,
  lineHeight: false,
  align: 0,
  tooltips: false,
  readingGuide: false,
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
  el.classList.toggle("a11y-desaturate", s.saturation === 1);
  el.classList.toggle("a11y-monochrome", s.saturation === 2);
  el.classList.toggle("a11y-line-height", s.lineHeight);
  el.classList.toggle("a11y-align-start", s.align === 1);
  el.classList.toggle("a11y-align-center", s.align === 2);
  el.classList.toggle("a11y-tooltips", s.tooltips);
  el.classList.toggle("a11y-reading-guide", s.readingGuide);
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
    saturation: "Saturation",
    lineHeight: "Line height",
    align: "Text align",
    tooltips: "Tooltips",
    structure: "Page structure",
    guide: "Reading guide",
    reset: "Reset all accessibility settings",
    headings: "Headings",
    links_list: "Links",
    low: "Low",
    gray: "Grayscale",
    start: "Start",
    center: "Center",
  },
  ar: {
    title: "قائمة الوصول",
    open: "خيارات إمكانية الوصول",
    contrast: "تباين عالٍ",
    text: "تكبير النص",
    spacing: "تباعد النص",
    links: "إبراز الروابط",
    dyslexia: "مناسب لعسر القراءة",
    images: "إخفاء الصور",
    anim: "وقف الرسوم المتحركة",
    cursor: "المؤشر",
    saturation: "التشبع",
    lineHeight: "ارتفاع خط",
    align: "محاذاة النص",
    tooltips: "التلميحات",
    structure: "هيكل الصفحة",
    guide: "مسطرة القراءة",
    reset: "إعادة تعيين كافة إعدادات إمكانية الوصول",
    headings: "العناوين",
    links_list: "الروابط",
    low: "منخفض",
    gray: "رمادي",
    start: "بداية",
    center: "وسط",
  },
} as const;

type Outline = { headings: { text: string; level: number }[]; links: string[] };

export function AccessibilityMenu({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const L = LABELS[getContentLanguage(i18n.resolvedLanguage ?? i18n.language)];
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [outline, setOutline] = useState<Outline | null>(null);

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

  // Reading guide bar follows the pointer
  useEffect(() => {
    if (!s.readingGuide) return;
    const bar = document.createElement("div");
    bar.className = "a11y-guide-bar";
    document.body.appendChild(bar);
    const onMove = (e: MouseEvent) => {
      bar.style.top = `${e.clientY - 18}px`;
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      bar.remove();
    };
  }, [s.readingGuide]);

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

  const openStructure = () => {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((h) => ({ text: (h.textContent ?? "").trim(), level: Number(h.tagName[1]) }))
      .filter((h) => h.text.length > 0)
      .slice(0, 40);
    const links = Array.from(document.querySelectorAll("a"))
      .map((a) => (a.textContent ?? "").trim())
      .filter((t) => t.length > 0)
      .slice(0, 40);
    setOutline({ headings, links });
  };

  const tiles: {
    key: string;
    label: string;
    icon: typeof Contrast;
    active: boolean;
    onClick: () => void;
    hint?: string;
  }[] = [
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
    { key: "structure", label: L.structure, icon: Layers, active: false, onClick: openStructure },
    { key: "tooltips", label: L.tooltips, icon: Info, active: s.tooltips, onClick: () => update({ tooltips: !s.tooltips }) },
    { key: "bigCursor", label: L.cursor, icon: MousePointer2, active: s.bigCursor, onClick: () => update({ bigCursor: !s.bigCursor }) },
    {
      key: "saturation",
      label: L.saturation,
      icon: Droplet,
      active: s.saturation > 0,
      onClick: () => update({ saturation: (s.saturation + 1) % 3 }),
      hint: s.saturation === 1 ? L.low : s.saturation === 2 ? L.gray : undefined,
    },
    {
      key: "align",
      label: L.align,
      icon: AlignLeft,
      active: s.align > 0,
      onClick: () => update({ align: (s.align + 1) % 3 }),
      hint: s.align === 1 ? L.start : s.align === 2 ? L.center : undefined,
    },
    { key: "lineHeight", label: L.lineHeight, icon: MoveVertical, active: s.lineHeight, onClick: () => update({ lineHeight: !s.lineHeight }) },
    { key: "guide", label: L.guide, icon: Ruler, active: s.readingGuide, onClick: () => update({ readingGuide: !s.readingGuide }) },
  ];

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={L.open}
            className={`relative h-10 w-10 overflow-hidden rounded-full bg-accent/10 text-accent shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow-glow ${className ?? ""}`}
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <Accessibility className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="max-h-[75vh] w-[21rem] overflow-y-auto p-3">
          <p className="mb-3 text-sm font-semibold">{L.title}</p>
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
          <Button
            variant="default"
            className="mt-3 w-full gap-2 rounded-xl"
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
            <RotateCcw className="h-4 w-4" />
            {L.reset}
          </Button>
        </PopoverContent>
      </Popover>

      <Dialog open={outline !== null} onOpenChange={(o) => !o && setOutline(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{L.structure}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2 font-semibold">{L.headings}</p>
              <ul className="space-y-1">
                {outline?.headings.map((h, i) => (
                  <li key={i} style={{ paddingInlineStart: `${(h.level - 1) * 12}px` }} className="text-muted-foreground">
                    {h.text}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">{L.links_list}</p>
              <ul className="space-y-1">
                {outline?.links.map((t, i) => (
                  <li key={i} className="text-muted-foreground">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
