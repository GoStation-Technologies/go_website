import { describe, expect, it } from "vitest";
import { leasingContent, type LeasingSection } from "./leasing-content";

const section: LeasingSection = {
  section_key: "spaces", title_en: "Retail space", title_ar: "المساحات المتاحة",
  subtitle_en: null, subtitle_ar: null, content_en: "Updated leasing guidelines", content_ar: "إرشادات التأجير المحدثة",
  media_url: "/api/public/media/cms/banner.jpg", is_visible: true,
};

describe("leasing CMS defaults and publication", () => {
  it("uses the supplied default when no saved section exists", () => {
    expect(leasingContent([], "ar").field("spaces", "content", "default guidelines")).toBe("default guidelines");
  });
  it("reads saved guidelines in the requested language", () => {
    expect(leasingContent([section], "ar").field("spaces", "content", "default")).toBe("إرشادات التأجير المحدثة");
  });
  it("uses localized defaults rather than another language when blank", () => {
    expect(leasingContent([{ ...section, content_ar: " " }], "ar").field("spaces", "content", "Arabic default")).toBe("Arabic default");
  });
  it("uses the saved banner image", () => {
    expect(leasingContent([section], "en").media("spaces", "/station-canopy.jpg")).toBe("/api/public/media/cms/banner.jpg");
  });
  it("does not expose hidden content or imagery", () => {
    const cms = leasingContent([{ ...section, is_visible: false }], "en");
    expect(cms.field("spaces", "content", "default")).toBe("default");
    expect(cms.media("spaces", "/station-canopy.jpg")).toBe("/station-canopy.jpg");
  });
});