import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * CMS server functions: site-wide settings, per-page editable sections and FAQs.
 * All writes go through RLS (media / super_admin only), so no admin client here.
 */

const SettingInput = z.object({
  key: z.string().min(1).max(80),
  value: z.record(z.string(), z.unknown()),
});

export const adminListSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("site_settings")
      .select("key, value, updated_at")
      .order("key");
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SettingInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_settings")
      .upsert(
        { key: data.key, value: data.value as unknown as never },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SectionInput = z.object({
  id: z.string().uuid().optional(),
  page_slug: z.string().min(1).max(60),
  section_key: z.string().min(1).max(60),
  title_en: z.string().max(300).nullish(),
  title_ar: z.string().max(300).nullish(),
  subtitle_en: z.string().max(600).nullish(),
  subtitle_ar: z.string().max(600).nullish(),
  content_en: z.string().max(8000).nullish(),
  content_ar: z.string().max(8000).nullish(),
  media_url: z.string().max(1000).nullish(),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_visible: z.boolean().default(true),
});

export const adminListSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("page_sections")
      .select("*")
      .order("page_slug")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminUpsertSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SectionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("page_sections")
      .upsert(data, { onConflict: "page_slug,section_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("page_sections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const FaqInput = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1).max(60).default("general"),
  question_en: z.string().min(1).max(500),
  question_ar: z.string().min(1).max(500),
  answer_en: z.string().min(1).max(5000),
  answer_ar: z.string().min(1).max(5000),
  status: z.enum(["draft", "published"]).default("draft"),
  sort_order: z.number().int().min(0).max(9999).default(0),
});

export const adminListFaqs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("faqs")
      .select("*")
      .order("sort_order")
      .order("created_at");
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminUpsertFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FaqInput.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      ...data,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    };
    const { error } = await context.supabase.from("faqs").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("faqs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
