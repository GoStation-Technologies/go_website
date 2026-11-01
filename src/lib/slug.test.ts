import { describe, expect, it } from "vitest";
import { uniqueSlug } from "./slug";

describe("uniqueSlug", () => {
  it("keeps the base slug when it is free", () => {
    expect(uniqueSlug("accountant", new Set())).toBe("accountant");
  });
  it("appends -2 when the base is taken, allowing duplicate job titles", () => {
    expect(uniqueSlug("accountant", new Set(["accountant"]))).toBe("accountant-2");
  });
  it("skips to the first free suffix", () => {
    expect(uniqueSlug("accountant", new Set(["accountant", "accountant-2"]))).toBe("accountant-3");
  });
  it("falls back to a placeholder for empty input", () => {
    expect(uniqueSlug("  ", new Set())).toBe("item");
  });
});
