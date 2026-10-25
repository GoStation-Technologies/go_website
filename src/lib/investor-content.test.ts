import { describe, expect, it } from "vitest";
import { metricText, ReportInput, reportMediaPath } from "./investor-content";

describe("Investor content", () => {
  it("uses the edited Arabic metric value", () => {
    expect(metricText({ content_ar: "4.5 مليار", content_en: "4.5B" }, "ar", "3.2B")).toBe("4.5 مليار");
  });
  it("keeps defaults for unavailable metric content", () => {
    expect(metricText({ is_visible: false, content_en: "999" }, "en", "224+")).toBe("224+");
  });
  it.each([2022, 2023, 2024, 2025, 2026])("allows annual reports for %i", (year) => {
    expect(ReportInput.parse({ title_ar: "تقرير مجلس الإدارة", title_en: "Board report", report_type: "annual", report_year: year, published_at: "2026-10-25", file_url: "/api/public/media/reports/annual.pdf", is_published: true }).report_year).toBe(year);
  });
  it("only serves uploaded report files, not arbitrary paths", () => {
    expect(reportMediaPath("https://gostation.sa/api/public/media/reports/2025/file.pdf")).toBe("reports/2025/file.pdf");
    expect(reportMediaPath("https://example.com/private.pdf")).toBeNull();
    expect(reportMediaPath("/api/public/media/reports/../../private.pdf")).toBeNull();
  });
});