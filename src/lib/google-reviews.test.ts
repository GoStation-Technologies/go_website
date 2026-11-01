import { describe, expect, it } from "vitest";
import { googlePlacesKey, parsePlaceReviews } from "./google-reviews";

describe("Google Places key fallback", () => {
  it("prefers GOOGLE_PLACES_API_KEY without a Lovable token", () => {
    expect(googlePlacesKey({ GOOGLE_PLACES_API_KEY: "places-test", GOOGLE_MAPS_API_KEY: "maps-test" })).toBe("places-test");
  });
  it("falls back to GOOGLE_MAPS_API_KEY", () => {
    expect(googlePlacesKey({ GOOGLE_PLACES_API_KEY: "", GOOGLE_MAPS_API_KEY: "maps-test", VITE_GOOGLE_MAPS_API_KEY: "vite-test" })).toBe("maps-test");
  });
  it("falls back to VITE_GOOGLE_MAPS_API_KEY", () => {
    expect(googlePlacesKey({ VITE_GOOGLE_MAPS_API_KEY: "vite-test" })).toBe("vite-test");
  });
  it("reports the requested missing-key message", () => {
    expect(() => googlePlacesKey({})).toThrow("Google Maps is not connected: Missing GOOGLE_PLACES_API_KEY");
  });
});

describe("Google legacy review parsing", () => {
  it("preserves ratings, attribution and timestamps", () => {
    const reviews = parsePlaceReviews("test-place", { status: "OK", result: { name: "GOStation", reviews: [{ author_name: "Visitor", author_url: "https://example.com/visitor", rating: 4, text: "Great", language: "en", time: 1700000000 }] } });
    expect(reviews[0]).toMatchObject({ placeId: "test-place", placeName: "GOStation", author: "Visitor", rating: 4, text: "Great", publishTime: "2023-11-14T22:13:20.000Z" });
  });
  it("keeps review IDs identical across language variants", () => {
    const payload = { status: "OK", result: { reviews: [{ author_url: "https://example.com/visitor", time: 1700000000, text: "Great" }] } };
    const first = parsePlaceReviews("test-place", payload);
    payload.result.reviews[0].text = "ممتاز";
    expect(parsePlaceReviews("test-place", payload)[0]?.id).toBe(first[0]?.id);
  });
  it("returns no reviews for ZERO_RESULTS", () => {
    expect(parsePlaceReviews("test-place", { status: "ZERO_RESULTS" })).toEqual([]);
  });
  it("preserves Google's error message on HTTP-success API failures", () => {
    expect(() => parsePlaceReviews("test-place", { status: "REQUEST_DENIED", error_message: "API key is invalid" })).toThrow("Google Places [REQUEST_DENIED]: API key is invalid");
  });
});