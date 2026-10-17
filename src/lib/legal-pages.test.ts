import { describe, expect, it } from "vitest";
import { legalDocumentText } from "./legal-pages";

describe("legal document publication", () => {
  it("does not substitute an absent Arabic legal text with English", () => {
    expect(legalDocumentText({ title_ar: null, content_ar: "", title_en: "Privacy", content_en: "English policy" }, "ar")).toEqual({ title: "", content: "" });
  });
  it("returns no content when no published document exists", () => {
    expect(legalDocumentText(null, "en")).toEqual({ title: "", content: "" });
  });
  it("reads the selected document translation", () => {
    expect(legalDocumentText({ title_ar: "الخصوصية", content_ar: "نص عربي", title_en: "Privacy", content_en: "English policy" }, "ar").content).toBe("نص عربي");
  });
});