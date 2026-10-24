export type LeasingSection = {
  section_key: string;
  title_en: string | null;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  media_url: string | null;
  is_visible: boolean;
};

export function leasingContent(sections: LeasingSection[], language: "ar" | "en") {
  const get = (key: string) => sections.find((section) => section.section_key === key);
  return {
    visible: (key: string) => get(key)?.is_visible ?? true,
    field: (key: string, field: "title" | "subtitle" | "content", fallback: string) => {
      const section = get(key);
      return (section?.is_visible !== false ? section?.[`${field}_${language}`]?.trim() || fallback : fallback).normalize("NFKC");
    },
    media: (key: string, fallback: string) => get(key)?.is_visible !== false ? get(key)?.media_url?.trim() || fallback : fallback,
  };
}