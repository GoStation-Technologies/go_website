/**
 * Pick a unique slug for a new record when the preferred base is taken.
 * "accountant" → "accountant", then "accountant-2", "accountant-3", …
 * `taken` must contain every existing slug that conflicts (including the
 * base itself); the current record's own slug must be excluded by the caller.
 */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const root = base.trim() || "item";
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
