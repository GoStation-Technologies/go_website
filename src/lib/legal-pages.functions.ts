import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { publicSupabaseEnv } from "@/lib/public-supabase-env";
import type { Database } from "@/integrations/supabase/types";

export const getLegalDocument = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.enum(["privacy-policy", "terms-and-conditions"]) }).parse(input))
  .handler(async ({ data }) => {
    const { url, key } = publicSupabaseEnv();
    if (!url || !key) throw new Error("Legal content is unavailable");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const { data: document, error } = await client.from("page_sections")
      .select("title_en, title_ar, content_en, content_ar")
      .eq("page_slug", data.slug).eq("section_key", "document").eq("is_visible", true).maybeSingle();
    if (error) throw new Error("Legal content is unavailable");
    return document;
  });