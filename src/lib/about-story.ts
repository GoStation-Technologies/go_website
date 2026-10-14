import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/use-cms";
import { getContentLanguage } from "@/lib/i18n";
import { ar } from "@/lib/locales/ar";
import { en } from "@/lib/locales/en";

/** Editable "Growth journey" + "Future roadmap" content (site_settings.about_story). */
export type Bi = { ar: string; en: string };
export type JourneyItem = { year: string; title: Bi; body: Bi; image: string };
export type RoadmapItem = { range: string; title: Bi; body: Bi; points: Bi };
export type AboutStory = {
  journey: { eyebrow: Bi; title: Bi; lead: Bi; items: JourneyItem[] };
  roadmap: { eyebrow: Bi; title: Bi; lead: Bi; items: RoadmapItem[] };
};

export const SETTING_KEY = "about_story";

const IMGS = ["/gostation-pylon.jpg", "/station-canopy.jpg", "/franchise-station.jpg", "/go-app-download.jpg", "/hero-cinematic.jpg", "/station-canopy.jpg"];
const YEARS = ["2016", "2018", "2020", "2022", "2024", "2026"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const A = (ar as Any).about;
const E = (en as Any).about;
const bi = (pick: (x: Any) => unknown): Bi => ({ ar: String(pick(A) ?? ""), en: String(pick(E) ?? "") });

export function defaultAboutStory(): AboutStory {
  return {
    journey: {
      eyebrow: bi((x) => x?.journey?.eyebrow),
      title: bi((x) => x?.journey?.title),
      lead: bi((x) => x?.journey?.lead),
      items: ["m1", "m2", "m3", "m4", "m5", "m6"].map((k, i) => ({
        year: YEARS[i],
        image: IMGS[i],
        title: bi((x) => x?.journey?.[k]?.title),
        body: bi((x) => x?.journey?.[k]?.body),
      })),
    },
    roadmap: {
      eyebrow: bi((x) => x?.roadmap?.eyebrow),
      title: bi((x) => x?.roadmap?.title),
      lead: bi((x) => x?.roadmap?.lead),
      items: ["p1", "p2", "p3"].map((k) => ({
        range: String(A?.roadmap?.[k]?.range ?? ""),
        title: bi((x) => x?.roadmap?.[k]?.title),
        body: bi((x) => x?.roadmap?.[k]?.body),
        points: bi((x) => ((x?.roadmap?.[k]?.items ?? []) as string[]).join("\n")),
      })),
    },
  };
}

/** Saved content, or the bundled defaults when nothing has been saved yet. */
export function readAboutStory(raw: unknown): AboutStory {
  const d = defaultAboutStory();
  const v = raw as Partial<AboutStory> | undefined;
  if (!v || typeof v !== "object") return d;
  return {
    journey: { ...d.journey, ...(v.journey ?? {}), items: v.journey?.items ?? d.journey.items },
    roadmap: { ...d.roadmap, ...(v.roadmap ?? {}), items: v.roadmap?.items ?? d.roadmap.items },
  };
}

export function useAboutStory() {
  const { i18n } = useTranslation();
  const lang = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const { settings } = useSiteSettings();
  const story = readAboutStory(settings[SETTING_KEY]);
  const L = (b: Bi | undefined) => (b ? (lang === "ar" ? b.ar || b.en : b.en || b.ar) : "");
  return { story, L };
}
