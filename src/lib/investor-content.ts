import { z } from "zod";

export const METRIC_DEFINITIONS = [
  { key: "metric_revenue", en: "Annual revenue", ar: "الإيرادات السنوية" },
  { key: "metric_growth", en: "Annual growth", ar: "النمو السنوي" },
  { key: "metric_stations", en: "Operating stations", ar: "المحطات التشغيلية" },
] as const;

export function metricText(section: { is_visible?: boolean; content_ar?: string | null; content_en?: string | null } | undefined, language: "ar" | "en", fallback: string) {
  if (!section || section.is_visible === false) return fallback;
  return section[`content_${language}`]?.trim() || fallback;
}

export const ReportInput = z.object({
  id: z.string().uuid().optional(),
  title_ar: z.string().trim().min(1).max(300),
  title_en: z.string().trim().min(1).max(300),
  report_type: z.enum(["annual", "quarterly", "esg"]),
  report_year: z.number().int().min(1900).max(9999),
  published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  file_url: z.string().regex(/^\/api\/public\/media\/reports\/[\w/-]+\.pdf$/),
  is_published: z.boolean(),
});

export function reportMediaPath(value: string): string | null {
  try {
    const pathname = new URL(value, "https://gostation.sa").pathname;
    const match = pathname.match(/^\/api\/public\/media\/(reports\/[\w/-]+\.pdf)$/);
    return match?.[1] ?? null;
  } catch { return null; }
}