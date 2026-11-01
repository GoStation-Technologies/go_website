import { describe, expect, it } from "vitest";
import { googlePlacesAccess, googleReviewUrl, isLovableReviewsHost, loadSelectedGoogleReviews, parsePlaceReviews, redact } from "./google-reviews";

describe("Google Places access resolution", () => {
  it("uses your own GOOGLE_PLACES_API_KEY directly, even when the connection exists", () => {
    const a = googlePlacesAccess({ GOOGLE_PLACES_API_KEY: "own", GOOGLE_MAPS_API_KEY: "conn", LOVABLE_API_KEY: "lov" });
    expect(a.mode).toBe("direct");
    expect(a.headers["X-Goog-Api-Key"]).toBe("own");
  });
  it("uses the linked Maps connection relay when GOOGLE_MAPS_API_KEY and LOVABLE_API_KEY exist", () => {
    const a = googlePlacesAccess({ GOOGLE_MAPS_API_KEY: "conn", LOVABLE_API_KEY: "lov" }, true);
    expect(a.mode).toBe("gateway");
    expect(a.headers["X-Connection-Api-Key"]).toBe("conn");
    expect(a.headers.Authorization).toBe("Bearer lov");
  });
  it("treats GOOGLE_MAPS_API_KEY as a direct Google key without LOVABLE_API_KEY", () => {
    const a = googlePlacesAccess({ GOOGLE_MAPS_API_KEY: "maps" });
    expect(a.mode).toBe("direct");
    expect(a.headers["X-Goog-Api-Key"]).toBe("maps");
  });
  it("ignores browser-bundled keys", () => {
    expect(() => googlePlacesAccess({ VITE_GOOGLE_MAPS_API_KEY: "vite" })).toThrow();
  });
  it("calls Google directly on standalone production even if a stale Lovable token exists", () => {
    const a = googlePlacesAccess({ GOOGLE_MAPS_API_KEY: "production", LOVABLE_API_KEY: "stale" }, isLovableReviewsHost("gostation.sa"));
    expect(a.mode).toBe("direct");
    expect(a.headers).toEqual({ "X-Goog-Api-Key": "production" });
  });
  it("recognizes only actual Lovable hosts, not forwarded preview lookalikes", () => {
    expect(isLovableReviewsHost("org-story-weaver.lovable.app")).toBe(true);
    expect(isLovableReviewsHost("lovable.app.attacker.test")).toBe(false);
    expect(isLovableReviewsHost("localhost")).toBe(false);
  });
  it("reports a missing key", () => {
    expect(() => googlePlacesAccess({})).toThrow("Google Maps is not connected: Missing GOOGLE_PLACES_API_KEY");
  });
  it("redacts keys from error text", () => {
    expect(redact("bad key abc123", ["abc123"])).toBe("bad key [redacted]");
  });
});

describe("selected stored Google reviews", () => {
  const now = Date.parse("2026-11-01T16:19:00Z");
  const review = parsePlaceReviews("p1", { reviews: [{ name: "places/p1/reviews/r1", text: { text: "Real review" }, rating: 5 }] })[0];
  const config = { places: ["p1"], shown: ["places/p1/reviews/r1"], reviews: [review], savedAt: "2026-11-01T16:00:00Z" };
  it("loads saved selections without calling Google even when a runtime key exists", async () => {
    let calls = 0;
    const result = await loadSelectedGoogleReviews(config, now, async () => { calls++; return { reviews: [], errors: [] }; });
    expect(calls).toBe(0);
    expect(result.reviews.map((r) => r.text)).toEqual(["Real review"]);
  });
  it("keeps available saved selections when Google returns an error for missing selections", async () => {
    const result = await loadSelectedGoogleReviews({ ...config, shown: [...config.shown, "places/p1/reviews/r2"] }, now,
      async () => ({ reviews: [], errors: ["Google Places request failed [403]: PERMISSION_DENIED"] }));
    expect(result.reviews.map((r) => r.id)).toEqual(config.shown);
    expect(result.errors).toEqual(["Google Places request failed [403]: PERMISSION_DENIED"]);
  });
  it("never substitutes dummy records after a Google failure with no stored records", async () => {
    const result = await loadSelectedGoogleReviews({ ...config, reviews: [] }, now, async () => ({ reviews: [], errors: ["401"] }));
    expect(result.reviews).toEqual([]);
    expect(result.errors).toEqual(["401"]);
  });
  it("does not publish records hidden by admin", async () => {
    let called = false;
    const result = await loadSelectedGoogleReviews({ ...config, shown: [] }, now, async () => { called = true; return { reviews: [review], errors: [] }; });
    expect(result.reviews).toEqual([]);
    expect(called).toBe(false);
  });
  it("refreshes expired snapshots rather than serving Google content indefinitely", async () => {
    let called = false;
    const result = await loadSelectedGoogleReviews({ ...config, savedAt: "2026-09-01T00:00:00Z" }, now, async () => { called = true; return { reviews: [], errors: ["503"] }; });
    expect(called).toBe(true);
    expect(result.reviews).toEqual([]);
  });
});

describe("Google review parsing", () => {
  const payload = {
    displayName: { text: "GOStation" },
    reviews: [
      {
        name: "places/p1/reviews/r1",
        rating: 4,
        text: { text: "Great", languageCode: "en" },
        publishTime: "2023-11-14T22:13:20Z",
        authorAttribution: { displayName: "Visitor", uri: "https://example.com/v" },
      },
    ],
  };
  it("keeps Google's review name as the ID so saved selections match", () => {
    expect(parsePlaceReviews("p1", payload)[0]).toMatchObject({ id: "places/p1/reviews/r1", author: "Visitor", rating: 4, text: "Great", placeName: "GOStation" });
  });
  it("returns no reviews when the listing has none", () => {
    expect(parsePlaceReviews("p1", {})).toEqual([]);
  });
  it("preserves the actual review URL rather than the station URL", async () => {
    const uri = "https://www.google.com/maps/reviews/data=review1";
    const reviews = parsePlaceReviews("p1", { googleMapsUri: "https://maps.google.com/?cid=station", reviews: [{ name: "places/p1/reviews/r1", googleMapsUri: uri }] });
    const result = await loadSelectedGoogleReviews({ places: ["p1"], shown: ["places/p1/reviews/r1"], reviews: JSON.parse(JSON.stringify(reviews)), savedAt: "2026-11-01T16:00:00Z" }, Date.parse("2026-11-01T17:22:00Z"), async () => ({ reviews: [], errors: [] }));
    expect(result.reviews[0].googleMapsUri).toBe(uri);
    expect(googleReviewUrl(result.reviews[0].googleMapsUri)).toBe(uri);
  });
  it("does not substitute a station link when the actual review URL is missing", () => {
    expect(parsePlaceReviews("p1", { googleMapsUri: "https://maps.google.com/?cid=station", reviews: [{}] })[0].googleMapsUri).toBeNull();
    expect(googleReviewUrl(null)).toBeNull();
    expect(googleReviewUrl(undefined)).toBeNull();
    expect(googleReviewUrl("")).toBeNull();
  });
  it("rejects malformed and unsafe external links", () => {
    expect(googleReviewUrl("javascript:alert(1)")).toBeNull();
    expect(googleReviewUrl("not a URL")).toBeNull();
    expect(googleReviewUrl("http://maps.google.com")).toBeNull();
  });
});
