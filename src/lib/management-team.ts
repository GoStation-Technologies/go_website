type ManagementRole = { title_en: string; title_ar: string; sort_order: number };

/** Titles, not row positions, determine the statement pair and executive grid. */
export function managementTeam<T extends ManagementRole>(leaders: T[]) {
  const chairman = leaders.find((leader) => /chairman/i.test(leader.title_en) || leader.title_ar.includes("رئيس مجلس"));
  const ceo = leaders.find((leader) =>
    /^(general )?chief executive officer\b/i.test(leader.title_en) ||
    /^الرئيس التنفيذي(?: العام)?(?:\s*\/|$)/.test(leader.title_ar),
  );
  const executiveRoles = [/deputy/i, /operating/i, /financial/i];
  const executives = leaders.filter((leader) => leader !== chairman && leader !== ceo)
    .sort((a, b) => {
      const rank = (leader: T) => {
        const index = executiveRoles.findIndex((role) => role.test(leader.title_en));
        return index < 0 ? executiveRoles.length : index;
      };
      return rank(a) - rank(b) || a.sort_order - b.sort_order;
    });
  return { chairman, ceo, executives };
}