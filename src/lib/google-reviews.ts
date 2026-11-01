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

export function googlePlacesKey(env: Record<string, string | undefined>) {
  const mapsKey = env.GOOGLE_PLACES_API_KEY || env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY;
  if (!mapsKey) throw new Error("Google Maps is not connected: Missing GOOGLE_PLACES_API_KEY");
  return mapsKey;
}

export type PlaceDetails = {
  status?: string;
  error_message?: string;
  result?: {
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: Array<{
      author_name?: string;
      author_url?: string;
      profile_photo_url?: string;
      rating?: number;
      text?: string;
      language?: string;
      relative_time_description?: string;
      time?: number;
    }>;
  };
};

export function parsePlaceReviews(placeId: string, data: PlaceDetails): GoogleReview[] {
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places [${data.status ?? "INVALID_RESPONSE"}]: ${data.error_message ?? "Place details unavailable"}`);
  }
  return (data.result?.reviews ?? []).map((review) => ({
    // Legacy Places has no review resource ID. Author + timestamp is stable across translations.
    id: `places/${placeId}/reviews/${encodeURIComponent(review.author_url ?? review.author_name ?? "Google user")}/${review.time ?? 0}`,
    placeId,
    placeName: data.result?.name ?? "",
    author: review.author_name ?? "Google user",
    authorPhoto: review.profile_photo_url ?? null,
    authorUri: review.author_url ?? null,
    rating: Number(review.rating ?? 0),
    text: review.text ?? "",
    lang: review.language ?? null,
    relativeTime: review.relative_time_description ?? "",
    publishTime: review.time === undefined ? "" : new Date(review.time * 1000).toISOString(),
    googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.result?.name ?? placeId)}&query_place_id=${encodeURIComponent(placeId)}`,
  }));
}