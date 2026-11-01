export type GoogleReview = {
  id: string;
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

export const PLACES_GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export type PlacesAccess =
  | { mode: "direct"; baseUrl: string; headers: Record<string, string>; secrets: string[] }
  | { mode: "gateway"; baseUrl: string; headers: Record<string, string>; secrets: string[] };

/**
 * Resolve how to reach Google Places (New) REST.
 * 1. GOOGLE_PLACES_API_KEY → your own Google key, called directly.
 * The relay is allowed only on explicitly recognized Lovable hosting.
 * Standalone hosting always uses a server-runtime Google key directly.
 */
export function googlePlacesAccess(env: Record<string, string | undefined>, allowGateway = false): PlacesAccess {
  const apiKey = env.GOOGLE_PLACES_API_KEY || env.GOOGLE_MAPS_API_KEY;
  const own = env.GOOGLE_PLACES_API_KEY;
  if (own) return { mode: "direct", baseUrl: "https://places.googleapis.com", headers: { "X-Goog-Api-Key": own }, secrets: [own] };
  const conn = env.GOOGLE_MAPS_API_KEY;
  const lovable = env.LOVABLE_API_KEY;
  if (allowGateway && conn && lovable) {
    return {
      mode: "gateway",
      baseUrl: PLACES_GATEWAY_URL,
      headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn },
      secrets: [conn, lovable],
    };
  }
  const fallback = apiKey;
  if (!fallback) throw new Error("Google Maps is not connected: Missing GOOGLE_PLACES_API_KEY");
  return { mode: "direct", baseUrl: "https://places.googleapis.com", headers: { "X-Goog-Api-Key": fallback }, secrets: [fallback] };
}

export function isLovableReviewsHost(hostname: string, development = false) {
  return hostname.endsWith(".lovable.app") || hostname.endsWith(".lovableproject.com") ||
    (development && (hostname === "localhost" || hostname === "127.0.0.1"));
}

export const storedGoogleReviewSchema = {
  // Runtime validation is supplied by the server's Zod schema before persistence.
  maxAgeMs: 30 * 24 * 60 * 60 * 1000,
};

export function selectedStoredReviews(reviews: GoogleReview[], shown: string[], places: string[], savedAt: string | undefined, now: number) {
  const saved = Date.parse(savedAt ?? "");
  if (!Number.isFinite(saved) || saved > now || now - saved > storedGoogleReviewSchema.maxAgeMs) return [];
  const byId = new Map(reviews.filter((r) => places.includes(r.placeId)).map((r) => [r.id, r]));
  return shown.flatMap((id) => {
    const review = byId.get(id);
    return review ? [review] : [];
  });
}

export async function loadSelectedGoogleReviews(
  config: { reviews: GoogleReview[]; shown: string[]; places: string[]; savedAt?: string },
  now: number,
  fetchLive: () => Promise<{ reviews: GoogleReview[]; errors: string[] }>,
) {
  if (!config.shown.length) return { reviews: [] as GoogleReview[], errors: [] as string[] };
  const stored = selectedStoredReviews(config.reviews, config.shown, config.places, config.savedAt, now);
  if (stored.length === new Set(config.shown).size) return { reviews: stored, errors: [] as string[] };
  const live = await fetchLive();
  const byId = new Map([...stored, ...live.reviews].map((r) => [r.id, r]));
  return { reviews: config.shown.flatMap((id) => {
    const review = byId.get(id);
    return review && config.places.includes(review.placeId) ? [review] : [];
  }), errors: live.errors };
}

export function redact(text: string, secrets: string[]) {
  return secrets.reduce((t, s) => (s ? t.split(s).join("[redacted]") : t), text);
}

export type PlaceDetails = {
  id?: string;
  displayName?: { text?: string };
  googleMapsUri?: string;
  reviews?: Array<{
    name?: string;
    rating?: number;
    text?: { text?: string; languageCode?: string };
    originalText?: { text?: string; languageCode?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  }>;
};

export function parsePlaceReviews(placeId: string, data: PlaceDetails): GoogleReview[] {
  const placeName = data.displayName?.text ?? "";
  return (data.reviews ?? []).map((review, i) => ({
    // Google's review resource name is stable across languages and matches saved selections.
    id: review.name ?? `places/${placeId}/reviews/unknown-${i}`,
    placeId,
    placeName,
    author: review.authorAttribution?.displayName ?? "Google user",
    authorPhoto: review.authorAttribution?.photoUri ?? null,
    authorUri: review.authorAttribution?.uri ?? null,
    rating: Number(review.rating ?? 0),
    text: review.text?.text ?? review.originalText?.text ?? "",
    lang: review.text?.languageCode ?? review.originalText?.languageCode ?? null,
    relativeTime: review.relativePublishTimeDescription ?? "",
    publishTime: review.publishTime ?? "",
    googleMapsUri: data.googleMapsUri ?? null,
  }));
}
