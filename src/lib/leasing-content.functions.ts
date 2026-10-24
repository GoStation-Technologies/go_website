import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "@/lib/public-supabase-env";
import type { Database } from "@/integrations/supabase/types";
import type { LeasingSection } from "@/lib/leasing-content";

export const getLeasingSections = createServerFn({ method: "GET" }).handler(async (): Promise<LeasingSection[]> => {
  const { url, key } = publicSupabaseEnv();
  if (!url || !key) return [];
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  try {
    const { data, error } = await client.from("page_sections")
      .select("section_key,title_en,title_ar,subtitle_en,subtitle_ar,content_en,content_ar,media_url,is_visible")
      .eq("page_slug", "leasing").eq("is_visible", true).order("sort_order");
    if (error) {
      console.error("Leasing CMS read failed", error.code);
      return [];
    }
    return data ?? [];
  } catch {
    console.error("Leasing CMS is temporarily unavailable");
    return [];
  }
});