import { describe, expect, it } from "vitest";
import { careersApplicationUrl } from "./careers-settings";

describe("careersApplicationUrl", () => {
  it("accepts an https form link", () => {
    expect(careersApplicationUrl(" https://forms.gle/abc ")).toBe("https://forms.gle/abc");
  });
  it("rejects empty or non-URL values", () => {
    expect(careersApplicationUrl("")).toBeNull();
    expect(careersApplicationUrl("forms.gle/abc")).toBeNull();
  });
  it("rejects javascript links", () => {
    expect(careersApplicationUrl("javascript:alert(1)")).toBeNull();
  });
});
