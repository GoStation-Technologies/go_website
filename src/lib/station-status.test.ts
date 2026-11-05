import { describe, expect, it } from "vitest";
import { isLocatorStation, stationLocatorStatus, stationStatusLabel } from "./station-status";

describe("station status labels", () => {
  it("labels active stations as operating", () => {
    expect(stationStatusLabel({ is_active: true }, false)).toBe("Operating");
  });
  it("preserves known inactive statuses", () => {
    expect(stationStatusLabel({ is_active: false, status: "مغلقة" }, false)).toBe("Closed");
    expect(stationStatusLabel({ is_active: false, status: "تحت الانشاء" }, false)).toBe("Under construction");
    expect(stationStatusLabel({ is_active: false, status: "تحت التطوير" }, true)).toBe("تحت التطوير");
    expect(stationStatusLabel({ is_active: false, status: "under maintenance" }, true)).toBe("تحت الصيانة");
  });
  it("does not invent maintenance or open status for unknown inactive stations", () => {
    expect(stationStatusLabel({ is_active: false }, false)).toBe("Not operating");
    expect(stationStatusLabel({ is_active: false, status: "اخرى" }, true)).toBe("غير مشغّلة حالياً");
  });
});

describe("public locator visibility", () => {
  it("includes operational stations and supported active aliases", () => {
    for (const status of ["active", "نشطة", "شغالة", "مفتوحة"]) {
      expect(stationLocatorStatus({ is_active: false, status })).toBe("active");
    }
    expect(isLocatorStation({ is_active: true })).toBe(true);
  });
  it("includes development and renovation without marking them active", () => {
    for (const status of ["under_development", "تحت التطوير", "تحت التاهيل", "تحت الإنشاء", "under renovation"]) {
      expect(stationLocatorStatus({ is_active: true, status })).toBe("under_development");
    }
  });
  it("excludes permanently closed stations even with a stale active flag", () => {
    for (const status of ["closed", "مغلقة", "permanently_closed"]) {
      expect(isLocatorStation({ is_active: true, status })).toBe(false);
      expect(isLocatorStation({ is_active: false, status })).toBe(false);
    }
  });
  it("All contains only active and development, not unknown inactive stations", () => {
    const stations = [
      { is_active: true, status: "active" },
      { is_active: false, status: "under_development" },
      { is_active: false, status: "closed" },
      { is_active: false, status: null },
    ];
    expect(stations.filter(isLocatorStation).map(s => s.status)).toEqual(["active", "under_development"]);
  });
});