import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Google Maps reviews, fetched live from Places API (New).
 * Only listing IDs and the admin's chosen review IDs are stored (site_settings.google_reviews);
 * review text is never copied into the database. Google returns at most 5 reviews per listing.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const SETTING_KEY = "google_reviews";
const DEFAULT_PLACES = ["ChIJ6w5n820ALz4ROR1c5Y6dePg"];
const MAX_PLACES = 10;

export type GoogleReview = {
  id: string; // Places review resource name
  placeId: string;
  placeName: string;
  author: string;
  authorPhoto: string | null;
  authorUri: string | null;
  rating: number;
  text: string;
  lang: string | null;
  relativeTime: string;
  publishTime: string;
  googleMapsUri: string | null;
};

type Config = { places: string[]; shown: string[] };

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function parseConfig(v: unknown): Config {
  const o = (v ?? {}) as Partial<Config>;
  const places = Array.isArray(o.places) && o.places.length ? o.places : DEFAULT_PLACES;
  return { places: places.slice(0, MAX_PLACES).map(String), shown: Array.isArray(o.shown) ? o.shown.map(String) : [] };
}

async function fetchPlaceReviews(placeId: string, lang: string): Promise<GoogleReview[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("Google Maps is not connected");
  const res = await fetch(
    `${GATEWAY_URL}/places/v1/places/${encodeURIComponent(placeId)}?languageCode=${lang}`,
    {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
        "X-Goog-FieldMask": "id,displayName,reviews,googleMapsUri",
      },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google reviews request failed [${res.status}]: ${body}`);
    throw new Error(`Google request failed [${res.status}]`);
  }
  const j = (await res.json()) as any;
  return ((j.reviews ?? []) as any[]).map((r) => ({
    id: String(r.name),
    placeId,
    placeName: j.displayName?.text ?? "",
    author: r.authorAttribution?.displayName ?? "Google user",
    authorPhoto: r.authorAttribution?.photoUri ?? null,
    authorUri: r.authorAttribution?.uri ?? null,
    rating: Number(r.rating ?? 5),
    text: r.text?.text ?? r.originalText?.text ?? "",
    lang: r.text?.languageCode ?? null,
    relativeTime: r.relativePublishTimeDescription ?? "",
    publishTime: r.publishTime ?? "",
    googleMapsUri: r.googleMapsUri ?? j.googleMapsUri ?? null,
  }));
}

async function fetchAll(places: string[], lang: string) {
  const results = await Promise.allSettled(places.map((p) => fetchPlaceReviews(p, lang)));
  const reviews: GoogleReview[] = [];
  const errors: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") reviews.push(...r.value);
    else errors.push(`${places[i]}: ${(r.reason as Error).message}`);
  });
  return { reviews, errors };
}

async function assertCmsAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const ok = (data ?? []).some((r: { role: string }) => r.role === "super_admin" || r.role === "media");
  if (!ok) throw new Error("Forbidden");
}

const Lang = z.enum(["ar", "en"]);

/** Admin: all reviews from every configured listing, with show/hide state. */
export const adminListGoogleReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lang: Lang }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCmsAdmin(context.supabase, context.userId);
    const { data: row } = await context.supabase
      .from("site_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
    const config = parseConfig(row?.value);
    const { reviews, errors } = await fetchAll(config.places, data.lang);
    return { config, reviews, errors };
  });

/** Admin: save listings and chosen reviews. */
export const adminSaveGoogleReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      places: z.array(z.string().regex(/^[A-Za-z0-9_-]{10,200}$/)).min(1).max(MAX_PLACES),
      shown: z.array(z.string().max(300)).max(100),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCmsAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: SETTING_KEY, value: data as never }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public: only the reviews the admin chose to show. No user input reaches Google besides language. */
export const getPublicGoogleReviews = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ lang: Lang }).parse(d))
  .handler(async ({ data }) => {
    try {
      const sb = publicClient();
      const { data: row } = await sb.from("site_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
      const config = parseConfig(row?.value);
      if (config.shown.length === 0) return { reviews: [] as GoogleReview[] };
      const shown = new Set(config.shown);
      const placeIds = config.places.filter((p) => config.shown.some((s) => s.startsWith(`places/${p}/`)));
      const { reviews } = await fetchAll(placeIds, data.lang);
      return { reviews: reviews.filter((r) => shown.has(r.id)) };
    } catch (e) {
      console.error("Public Google reviews failed", e);
      return { reviews: [] as GoogleReview[] };
    }
  });
