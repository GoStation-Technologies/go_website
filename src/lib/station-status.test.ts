import { describe, expect, it } from "vitest";
import { stationStatusLabel } from "./station-status";

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
    expect(stationStatusLabel({ is_active: false, status: "مفتوحة" }, true)).toBe("غير مشغّلة حالياً");
  });
});