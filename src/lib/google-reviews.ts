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
 * 2. GOOGLE_MAPS_API_KEY + LOVABLE_API_KEY → the linked Maps connection (that key only works via the relay).
 * 3. GOOGLE_MAPS_API_KEY / VITE_GOOGLE_MAPS_API_KEY alone → treated as your own Google key.
 */
export function googlePlacesAccess(env: Record<string, string | undefined>): PlacesAccess {
  const own = env.GOOGLE_PLACES_API_KEY;
  if (own) return { mode: "direct", baseUrl: "https://places.googleapis.com", headers: { "X-Goog-Api-Key": own }, secrets: [own] };
  const conn = env.GOOGLE_MAPS_API_KEY;
  const lovable = env.LOVABLE_API_KEY;
  if (conn && lovable) {
    return {
      mode: "gateway",
      baseUrl: PLACES_GATEWAY_URL,
      headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn },
      secrets: [conn, lovable],
    };
  }
  const fallback = conn || env.VITE_GOOGLE_MAPS_API_KEY;
  if (!fallback) throw new Error("Google Maps is not connected: Missing GOOGLE_PLACES_API_KEY");
  return { mode: "direct", baseUrl: "https://places.googleapis.com", headers: { "X-Goog-Api-Key": fallback }, secrets: [fallback] };
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
