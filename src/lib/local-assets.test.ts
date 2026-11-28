import { describe, expect, it } from "vitest";
import { localAsset } from "./local-assets";

describe("local core asset resolution", () => {
  it("serves the saved homepage banner from the VPS", () => {
    expect(localAsset("https://org-story-weaver.lovable.app/api/public/media/cms/e0bad1c1-fe5b-4774-8d1d-1ff2cb3ba2bc.jpg")).toBe("/images/home-hero.jpg");
  });
  it("keeps old saved fallback references working after the move", () => {
    expect(localAsset("/station-canopy.jpg")).toBe("/images/station-canopy.jpg");
    expect(localAsset("/gostation-logo.png")).toBe("/images/gostation-logo.png");
  });
  it("does not override a newly uploaded CMS banner", () => {
    const newUpload = "https://org-story-weaver.lovable.app/api/public/media/cms/new-banner.jpg";
    expect(localAsset(newUpload)).toBe(newUpload);
  });
  it("does not rewrite unrelated images or already-local paths", () => {
    expect(localAsset("https://example.com/station-canopy.jpg")).toBe("https://example.com/station-canopy.jpg");
    expect(localAsset("/images/home-hero.jpg")).toBe("/images/home-hero.jpg");
  });
});