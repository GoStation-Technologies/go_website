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
  it("reserves Salem for the top CEO statement, not the lower team", () => {
    const team = managementTeam(leaders);
    expect(team.ceo?.name).toBe("سالم صالح النهدي");
    expect(team.executives).not.toContain(team.ceo);
  });
  it("orders the lower executive grid as deputy, operations and finance", () => {
    expect(managementTeam(leaders).executives.map((leader) => leader.name)).toEqual([
      "عبد العزيز سالم باكرمان", "عبد العزيز بن عايض القحطاني", "طارق فتحي",
    ]);
  });
  it("recognizes the edited CEO title with a dash and abbreviation", () => {
    const edited = leaders.map((leader) => leader.name === "سالم صالح النهدي"
      ? { ...leader, title_en: "CEO – Board Member", title_ar: "الرئيس التنفيذي - عضو مجلس الإدارة", updated_at: "2026-11-05T03:27:00Z" }
      : { ...leader, updated_at: "2026-10-01T00:00:00Z" });
    expect(managementTeam(edited.reverse()).ceo?.name).toBe("سالم صالح النهدي");
  });
  it("preserves approved identity hierarchy when titles and row positions change", () => {
    const edited = leaders.map((leader) => ({ ...leader, name_ar: leader.name, title_ar: "", title_en: "Board Member", sort_order: 99 }));
    expect(managementTeam(edited).executives.map((leader) => leader.name)).toEqual([
      "عبد العزيز سالم باكرمان", "عبد العزيز بن عايض القحطاني", "طارق فتحي",
    ]);
  });
  it("uses ascending stored display order for additional members without mutating records", () => {
    const additional = [
      { name: "second", title_ar: "", title_en: "Director", sort_order: 8 },
      { name: "first", title_ar: "", title_en: "Director", sort_order: 6 },
    ];
    expect(managementTeam(additional).executives.map((leader) => leader.name)).toEqual(["first", "second"]);
    expect(additional.map((leader) => leader.sort_order)).toEqual([8, 6]);
  });
  it("keeps the saved chairman and CEO IDs featured after every editable field changes", () => {
    const edited = [
      { id: "90ef83d9-fc6b-4962-81c9-d9d070fb6bd5", name_ar: "اسم محدث", title_ar: "", title_en: "Board Member", sort_order: 99, bio_ar: "نبذة جديدة", photo_url: "/new-ceo.png", updated_at: "2026-11-07" },
      { id: "89dfab7d-9491-49e6-8d54-6aa6b3411d9e", name_ar: "اسم آخر", title_ar: "", title_en: "Director", sort_order: 100 },
    ];
    const team = managementTeam(edited);
    expect(team.chairman?.id).toBe("89dfab7d-9491-49e6-8d54-6aa6b3411d9e");
    expect(team.ceo?.id).toBe("90ef83d9-fc6b-4962-81c9-d9d070fb6bd5");
    expect(team.executives).toEqual([]);
  });
});