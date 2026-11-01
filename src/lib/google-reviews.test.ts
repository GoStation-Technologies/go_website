import { describe, expect, it } from "vitest";
import { googlePlacesAccess, parsePlaceReviews, redact } from "./google-reviews";

describe("Google Places access resolution", () => {
  it("uses your own GOOGLE_PLACES_API_KEY directly, even when the connection exists", () => {
    const a = googlePlacesAccess({ GOOGLE_PLACES_API_KEY: "own", GOOGLE_MAPS_API_KEY: "conn", LOVABLE_API_KEY: "lov" });
    expect(a.mode).toBe("direct");
    expect(a.headers["X-Goog-Api-Key"]).toBe("own");
  });
  it("uses the linked Maps connection relay when GOOGLE_MAPS_API_KEY and LOVABLE_API_KEY exist", () => {
    const a = googlePlacesAccess({ GOOGLE_MAPS_API_KEY: "conn", LOVABLE_API_KEY: "lov" });
    expect(a.mode).toBe("gateway");
    expect(a.headers["X-Connection-Api-Key"]).toBe("conn");
    expect(a.headers.Authorization).toBe("Bearer lov");
  });
  it("treats GOOGLE_MAPS_API_KEY as a direct Google key without LOVABLE_API_KEY", () => {
    const a = googlePlacesAccess({ GOOGLE_MAPS_API_KEY: "maps" });
    expect(a.mode).toBe("direct");
    expect(a.headers["X-Goog-Api-Key"]).toBe("maps");
  });
  it("falls back to VITE_GOOGLE_MAPS_API_KEY", () => {
    expect(googlePlacesAccess({ VITE_GOOGLE_MAPS_API_KEY: "vite" }).headers["X-Goog-Api-Key"]).toBe("vite");
  });
  it("reports a missing key", () => {
    expect(() => googlePlacesAccess({})).toThrow("Google Maps is not connected: Missing GOOGLE_PLACES_API_KEY");
  });
  it("redacts keys from error text", () => {
    expect(redact("bad key abc123", ["abc123"])).toBe("bad key [redacted]");
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
});
