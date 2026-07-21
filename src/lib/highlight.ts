export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type HighlightSegment = { text: string; match: boolean };

/**
 * Split `text` into ordered segments, tagging every case-insensitive
 * occurrence of `query` as `match: true`. Pure + framework-agnostic so
 * it can be unit-tested without React.
 *
 * - Empty / whitespace-only queries produce a single non-matching segment.
 * - Regex metacharacters in `query` are escaped (treated as literals).
 * - Empty splits from adjacent matches are dropped to keep output stable.
 */
export function splitHighlight(text: string, query: string): HighlightSegment[] {
  const q = (query ?? "").trim();
  if (!q) return [{ text, match: false }];
  const re = new RegExp(`(${escapeRegExp(q)})`, "gi");
  const parts = text.split(re);
  const out: HighlightSegment[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "") continue;
    out.push({ text: part, match: i % 2 === 1 });
  }
  return out.length ? out : [{ text: "", match: false }];
}
