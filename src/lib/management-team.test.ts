import { describe, expect, it } from "vitest";
import { managementTeam } from "./management-team";

const leaders = [
  { name: "طارق فتحي", title_ar: "الرئيس التنفيذي المالي", title_en: "Chief Financial Officer", sort_order: 0 },
  { name: "عبد العزيز بن عايض القحطاني", title_ar: "الرئيس التنفيذي للعمليات", title_en: "Chief Operating Officer", sort_order: 1 },
  { name: "سالم صالح النهدي", title_ar: "الرئيس التنفيذي / عضو مجلس الإدارة", title_en: "Chief Executive Officer / Board Member", sort_order: 2 },
  { name: "عبد العزيز سالم باكرمان", title_ar: "نائب الرئيس التنفيذي والرئيس التنفيذي لتطوير الأعمال", title_en: "Deputy CEO & Chief Business Development Officer", sort_order: 3 },
  { name: "عارف سالم النهدي", title_ar: "رئيس مجلس الإدارة", title_en: "Chairman of the Board", sort_order: 4 },
];

describe("Senior Management grouping", () => {
  it("places Aref in the chairman statement", () => {
    expect(managementTeam(leaders).chairman?.name).toBe("عارف سالم النهدي");
  });
  it("places Salem in the CEO statement, not an operational executive", () => {
    const team = managementTeam(leaders);
    expect(team.ceo?.name).toBe("سالم صالح النهدي");
    expect(team.executives).not.toContain(team.ceo);
  });
  it("orders the executive grid as deputy, operations and finance", () => {
    expect(managementTeam(leaders).executives.map((leader) => leader.name)).toEqual([
      "عبد العزيز سالم باكرمان", "عبد العزيز بن عايض القحطاني", "طارق فتحي",
    ]);
  });
});