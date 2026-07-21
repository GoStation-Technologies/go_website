import { describe, it, expect } from "vitest";
import { getContentLanguage, isRtl } from "./i18n";

describe("getContentLanguage", () => {
  it("returns 'en' for undefined without throwing", () => {
    expect(getContentLanguage(undefined)).toBe("en");
  });
  it("returns 'en' for null", () => {
    expect(getContentLanguage(null)).toBe("en");
  });
  it("returns 'en' for empty string", () => {
    expect(getContentLanguage("")).toBe("en");
  });
  it("returns 'en' for non-string values", () => {
    expect(getContentLanguage(123)).toBe("en");
    expect(getContentLanguage({})).toBe("en");
  });
  it("detects Arabic", () => {
    expect(getContentLanguage("ar")).toBe("ar");
    expect(getContentLanguage("ar-SA")).toBe("ar");
    expect(getContentLanguage("AR")).toBe("ar");
  });
  it("returns 'en' for English variants", () => {
    expect(getContentLanguage("en")).toBe("en");
    expect(getContentLanguage("en-US")).toBe("en");
  });
});

describe("isRtl", () => {
  it("returns false for undefined without throwing (SSR regression)", () => {
    expect(() => isRtl(undefined)).not.toThrow();
    expect(isRtl(undefined)).toBe(false);
  });
  it("returns true for Arabic locales", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("ar-SA")).toBe(true);
  });
  it("returns false for English", () => {
    expect(isRtl("en-US")).toBe(false);
  });
});
