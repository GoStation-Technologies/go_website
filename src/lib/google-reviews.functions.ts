import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { publicSupabaseEnv } from "@/lib/public-supabase-env";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { googlePlacesAccess, isLovableReviewsHost, loadSelectedGoogleReviews, parsePlaceReviews, redact, type GoogleReview, type PlaceDetails, type PlacesAccess } from "./google-reviews";
export type { GoogleReview } from "./google-reviews";

/**
 * Google Maps reviews from Places (New) REST: your own Google key directly, or the linked Maps connection.
 * Admin-selected snapshots and listing IDs are stored in site_settings.google_reviews.
 * Public reads prefer those snapshots; empty or failed sources never become sample reviews.
 */

const SETTING_KEY = "google_reviews";
const DEFAULT_PLACES = ["ChIJ6w5n820ALz4ROR1c5Y6dePg"];
const MAX_PLACES = 10;

const Review = z.object({
  id: z.string().max(300), placeId: z.string().max(200), placeName: z.string().max(500),
  author: z.string().max(500), authorPhoto: z.string().max(2000).nullable(), authorUri: z.string().max(2000).nullable(),
  rating: z.number().min(0).max(5), text: z.string().max(20000), lang: z.string().max(30).nullable(),
  relativeTime: z.string().max(500), publishTime: z.string().max(100), googleMapsUri: z.string().max(2000).nullable().default(null),
});
type Config = { places: string[]; shown: string[]; reviews: GoogleReview[]; savedAt?: string };

function publicClient() {
  const { url, key } = publicSupabaseEnv();
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set on this server");
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
  const reviews = z.array(Review).max(100).safeParse(o.reviews);
  return { places: places.slice(0, MAX_PLACES).map(String), shown: Array.isArray(o.shown) ? o.shown.map(String) : [],
    reviews: reviews.success ? reviews.data : [], savedAt: typeof o.savedAt === "string" ? o.savedAt : undefined };
}

async function fetchPlaceReviews(placeId: string, lang: string, access: PlacesAccess): Promise<GoogleReview[]> {
  try {
    const res = await fetch(
      `${access.baseUrl}/places/v1/places/${encodeURIComponent(placeId)}?languageCode=${lang}`,
      {
        headers: { ...access.headers, "X-Goog-FieldMask": "id,displayName,googleMapsUri,reviews" },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) {
      const body = redact(await res.text(), access.secrets);
      throw new Error(`Google Places request failed [${res.status}]: ${body}`);
    }
    return parsePlaceReviews(placeId, (await res.json()) as PlaceDetails);
  } catch (error) {
    const message = redact(error instanceof Error ? error.message : "Google Places request failed", access.secrets);
    console.error(`Google reviews: ${message}`);
    throw new Error(message);
  }
}

async function fetchAll(places: string[], lang: string, access: PlacesAccess) {
  const results = await Promise.allSettled(places.map((p) => fetchPlaceReviews(p, lang, access)));
  const reviews: GoogleReview[] = [];
  const errors: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") reviews.push(...r.value);
    else errors.push(`${places[i]}: ${(r.reason as Error).message}`);
  });
  return { reviews, errors };
}

/**
 * Google returns a different set of 5 reviews per language, so a review chosen
 * while browsing in one language may be missing in the other. Fetch the
 * requested language first, then the other one, and merge (deduped by id).
 */
async function fetchBothLangs(places: string[], lang: "ar" | "en", access: PlacesAccess, needed?: Set<string>) {
  const first = await fetchAll(places, lang, access);
  const have = new Set(first.reviews.map((r) => r.id));
  if (needed && [...needed].every((id) => have.has(id))) return first;
  const other = await fetchAll(places, lang === "ar" ? "en" : "ar", access);
  const reviews = [...first.reviews, ...other.reviews.filter((r) => !have.has(r.id))];
  return { reviews, errors: [...first.errors, ...other.errors] };
}

async function assertCmsAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const ok = (data ?? []).some((r: { role: string }) => r.role === "super_admin" || r.role === "media");
  if (!ok) throw new Error("Forbidden");
}

const Lang = z.enum(["ar", "en"]);

/** Admin: search Google listings by name/address so admins don't need raw Place IDs. */
export const adminSearchGooglePlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ query: z.string().trim().min(2).max(200), lang: Lang }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCmsAdmin(context.supabase, context.userId);
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    const access = googlePlacesAccess({ GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
      GOOGLE_MAPS_API_KEY: apiKey, LOVABLE_API_KEY: process.env.LOVABLE_API_KEY },
      isLovableReviewsHost(new URL(getRequest().url).hostname, import.meta.env.DEV));
    const res = await fetch(`${access.baseUrl}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        ...access.headers,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.userRatingCount",
      },
      body: JSON.stringify({ textQuery: data.query, languageCode: data.lang, regionCode: "SA", pageSize: 10 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = redact(await res.text(), access.secrets);
      console.error(`Google place search failed [${res.status}]: ${body}`);
      throw new Error(`Google search failed [${res.status}]: ${body}`);
    }
    const j = (await res.json()) as any;
    return ((j.places ?? []) as any[]).map((p) => ({
      id: String(p.id),
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      reviews: Number(p.userRatingCount ?? 0),
    }));
  });

/** Admin: all reviews from every configured listing, with show/hide state. */
export const adminListGoogleReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lang: Lang }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCmsAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("site_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
    if (error) throw new Error(`Google review settings read failed: ${error.message}`);
    const config = parseConfig(row?.value);
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    const access = googlePlacesAccess({ GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
      GOOGLE_MAPS_API_KEY: apiKey, LOVABLE_API_KEY: process.env.LOVABLE_API_KEY },
      isLovableReviewsHost(new URL(getRequest().url).hostname, import.meta.env.DEV));
    const { reviews, errors } = await fetchBothLangs(config.places, data.lang, access);
    return { config, reviews, errors };
  });

/** Admin: save listings and chosen reviews. */
export const adminSaveGoogleReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      places: z.array(z.string().regex(/^[A-Za-z0-9_-]{10,200}$/)).min(1).max(MAX_PLACES),
      shown: z.array(z.string().max(300)).max(100),
      reviews: z.array(Review).max(100).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCmsAdmin(context.supabase, context.userId);
    const { data: previous, error: readError } = await context.supabase.from("site_settings")
      .select("value").eq("key", SETTING_KEY).maybeSingle();
    if (readError) throw new Error(readError.message);
    const old = parseConfig(previous?.value);
    const selected = new Set(data.shown);
    const supplied = (data.reviews ?? []).filter((r) => selected.has(r.id) && data.places.includes(r.placeId));
    const byId = new Map([...old.reviews, ...supplied].map((r) => [r.id, r]));
    const snapshots = [...byId.values()].filter((r) => selected.has(r.id) && data.places.includes(r.placeId));
    const value = { places: data.places, shown: data.shown, reviews: snapshots,
      savedAt: supplied.length ? new Date().toISOString() : old.savedAt };
    // Use the authenticated standard client even when no service-role key is available.
    // Its existing CMS RLS permissions govern every write; no privileged client is needed.
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: SETTING_KEY, value: value as never }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public: only the reviews the admin chose to show. No user input reaches Google besides language. */
export const getPublicGoogleReviews = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ lang: Lang }).parse(d))
  .handler(async ({ data }) => {
    try {
      const sb = publicClient();
      const { data: row, error } = await sb.from("site_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
      if (error) throw new Error(`Google review settings read failed: ${error.message}`);
      const config = parseConfig(row?.value);
      const { reviews, errors } = await loadSelectedGoogleReviews(config, Date.now(), async () => {
        // Read runtime secrets only inside the server handler, never from VITE/client configuration.
        const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
        try {
          const access = googlePlacesAccess({ GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
            GOOGLE_MAPS_API_KEY: apiKey, LOVABLE_API_KEY: process.env.LOVABLE_API_KEY },
            isLovableReviewsHost(new URL(getRequest().url).hostname, import.meta.env.DEV));
          const placeIds = config.places.filter((p) => config.shown.some((s) => s.startsWith(`places/${p}/`)));
          return await fetchBothLangs(placeIds, data.lang, access, new Set(config.shown));
        } catch (error) {
          const message = redact(error instanceof Error ? error.message : "Review fetch failed", [apiKey ?? "", process.env.LOVABLE_API_KEY ?? ""]);
          console.error(`Google reviews configuration/fetch failed: ${message}`);
          return { reviews: [] as GoogleReview[], errors: [message] };
        }
      });
      if (errors.length) console.error("Public Google reviews errors:", errors.join(" | "));
      return { reviews };
    } catch (e) {
      console.error("Public Google reviews failed", e);
      return { reviews: [] as GoogleReview[] };
    }
  });
