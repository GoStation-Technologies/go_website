import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";

/**
 * Public CMS reads. Every hook returns plain data plus helpers that fall back
 * to the existing static/i18n copy, so pages render instantly (and unchanged)
 * while fetching or when a record is empty.
 */

export type SiteSettings = Record<string, Record<string, unknown>>;

export type PageSection = {
  id: string;
  page_slug: string;
  section_key: string;
  title_en: string | null;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  media_url: string | null;
  is_visible: boolean;
  sort_order: number;
};

export function useSiteSettings() {
  const q = useQuery({
    queryKey: ["cms", "site_settings"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const out: SiteSettings = {};
      for (const row of data ?? []) {
        out[row.key] = (row.value ?? {}) as Record<string, unknown>;
      }
      return out;
    },
  });

  const settings = q.data ?? {};
  /** Read a single field with a static fallback. */
  const setting = (group: string, field: string, fallback = ""): string => {
    const v = settings[group]?.[field];
    return typeof v === "string" && v.trim() ? v : fallback;
  };
  return { settings, setting, isLoading: q.isLoading };
}

export function usePageContent(pageSlug: string) {
  const { i18n } = useTranslation();
  const lang = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);

  const q = useQuery({
    queryKey: ["cms", "page_sections", pageSlug],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PageSection[]> => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_slug", pageSlug)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as PageSection[];
    },
  });

  const sections = q.data ?? [];
  const get = (sectionKey: string) => sections.find((s) => s.section_key === sectionKey);

  /**
   * Localized field getter with fallback: `field("hero", "title", t("home.title"))`.
   * Falls back to the other language, then to the provided static default.
   */
  const field = (
    sectionKey: string,
    name: "title" | "subtitle" | "content",
    fallback = "",
  ): string => {
    const s = get(sectionKey);
    if (!s || s.is_visible === false) return fallback;
    const primary = s[`${name}_${lang}` as keyof PageSection] as string | null;
    const secondary = s[`${name}_${lang === "ar" ? "en" : "ar"}` as keyof PageSection] as
      | string
      | null;
    return (primary?.trim() || secondary?.trim() || fallback) as string;
  };

  /** Section image with static fallback. */
  const media = (sectionKey: string, fallback = ""): string =>
    get(sectionKey)?.media_url?.trim() || fallback;

  /** Sections default to visible when no record exists yet. */
  const visible = (sectionKey: string): boolean => get(sectionKey)?.is_visible ?? true;

  return { sections, get, field, media, visible, isLoading: q.isLoading };
}

export type Faq = {
  id: string;
  category: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  sort_order: number;
};

export function useFaqs(category?: string) {
  const { i18n } = useTranslation();
  const lang = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);

  const q = useQuery({
    queryKey: ["cms", "faqs", category ?? "all"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Faq[]> => {
      let query = supabase.from("faqs").select("*").eq("status", "published").order("sort_order");
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Faq[];
    },
  });

  const items = (q.data ?? []).map((f) => ({
    id: f.id,
    category: f.category,
    question: lang === "ar" ? f.question_ar : f.question_en,
    answer: lang === "ar" ? f.answer_ar : f.answer_en,
  }));

  return { items, isLoading: q.isLoading };
}
