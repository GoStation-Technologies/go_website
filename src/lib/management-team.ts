type ManagementRole = { title_en: string; title_ar: string; sort_order: number; name_ar?: string };

/** Approved hierarchy is stable across title edits; stored order breaks ties for other members. */
function hierarchyRank(leader: ManagementRole) {
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
  const executives = ordered.filter((leader) => hierarchyRank(leader) !== 0);
  return { chairman, ceo, executives };
}