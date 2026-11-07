type ManagementRole = { id?: string; title_en: string; title_ar: string; sort_order: number; name_ar?: string };

// Bind the approved CMS records to permanent slots, independent of editable profile fields.
const leadershipIds = [
  "89dfab7d-9491-49e6-8d54-6aa6b3411d9e", // Chairman
  "90ef83d9-fc6b-4962-81c9-d9d070fb6bd5", // CEO / Board Member
  "c48cc65d-2dd4-4adb-9ca6-d80ca8768642", // Deputy CEO
  "edfe0787-b893-4964-b108-db42febba92e", // COO
  "26f16d8f-569b-4993-b876-50d48078b732", // CFO
];

/** Approved hierarchy is stable across title edits; stored order breaks ties for other members. */
function hierarchyRank(leader: ManagementRole) {
  const recordRank = leader.id ? leadershipIds.indexOf(leader.id) : -1;
  if (recordRank >= 0) return recordRank;
  const name = leader.name_ar?.replace(/\s/g, "") ?? "";
  const names = ["عارفسالمالنهدي", "سالمصالحالنهدي", "عبدالعزيزسالمباكرمان", "عبدالعزيزبنعايضالقحطاني", "طارقفتحي"];
  const identityRank = names.indexOf(name);
  if (identityRank >= 0) return identityRank;
  if (/chairman/i.test(leader.title_en) || /رئيس مجلس/.test(leader.title_ar)) return 0;
  if (/deputy/i.test(leader.title_en) || /نائب الرئيس التنفيذي/.test(leader.title_ar)) return 2;
  if (/operating|\bCOO\b/i.test(leader.title_en) || /للعمليات/.test(leader.title_ar)) return 3;
  if (/financial|\bCFO\b/i.test(leader.title_en) || /المالي/.test(leader.title_ar)) return 4;
  if (/^(?:general )?chief executive officer\b|^CEO\b/i.test(leader.title_en) ||
    /^الرئيس التنفيذي(?: العام)?(?:\s*(?:[\/–—-]|عضو)|$)/.test(leader.title_ar)) return 1;
  return 5;
}

export function managementTeam<T extends ManagementRole>(leaders: T[]) {
  const ordered = [...leaders].sort((a, b) => hierarchyRank(a) - hierarchyRank(b) || a.sort_order - b.sort_order);
  const chairman = ordered.find((leader) => hierarchyRank(leader) === 0);
  const ceo = ordered.find((leader) => hierarchyRank(leader) === 1);
  const executives = ordered.filter((leader) => hierarchyRank(leader) > 1);
  return { chairman, ceo, executives };
}