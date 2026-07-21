import { describe, it, expect } from "vitest";
import { splitHighlight, escapeRegExp } from "./highlight";

describe("splitHighlight", () => {
  it("returns a single non-matching segment for empty query", () => {
    expect(splitHighlight("hello world", "")).toEqual([
      { text: "hello world", match: false },
    ]);
    expect(splitHighlight("hello world", "   ")).toEqual([
      { text: "hello world", match: false },
    ]);
  });

  it("marks a single case-sensitive-literal match", () => {
    expect(splitHighlight("hello world", "world")).toEqual([
      { text: "hello ", match: false },
      { text: "world", match: true },
    ]);
  });

  it("matches case-insensitively while preserving the source casing", () => {
    expect(splitHighlight("Hello WORLD", "world")).toEqual([
      { text: "Hello ", match: false },
      { text: "WORLD", match: true },
    ]);
    expect(splitHighlight("hello world", "HELLO")).toEqual([
      { text: "hello", match: true },
      { text: " world", match: false },
    ]);
  });

  it("marks every occurrence when the keyword appears multiple times", () => {
    const segs = splitHighlight("ab AB Ab ba", "ab");
    // three matches ("ab", "AB", "Ab") + surrounding text
    expect(segs.filter((s) => s.match).map((s) => s.text)).toEqual(["ab", "AB", "Ab"]);
    // reassembly is lossless
    expect(segs.map((s) => s.text).join("")).toBe("ab AB Ab ba");
  });

  it("handles adjacent matches without emitting empty segments", () => {
    const segs = splitHighlight("abab", "ab");
    expect(segs.every((s) => s.text.length > 0)).toBe(true);
    expect(segs.filter((s) => s.match).map((s) => s.text)).toEqual(["ab", "ab"]);
    expect(segs.map((s) => s.text).join("")).toBe("abab");
  });

  it("matches session-id prefix substrings", () => {
    // Real UUID prefix as it appears in the admin UI (first 8 chars, lowercase).
    const segs = splitHighlight("abcd1234", "ABCD");
    expect(segs).toEqual([
      { text: "abcd", match: true },
      { text: "1234", match: false },
    ]);
  });

  it("treats regex metacharacters as literals", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
    const segs = splitHighlight("price: $10.00 (usd)", "$10.00");
    expect(segs.filter((s) => s.match).map((s) => s.text)).toEqual(["$10.00"]);
    // "." must not match arbitrary chars
    expect(splitHighlight("axc a.c", "a.c").filter((s) => s.match).map((s) => s.text)).toEqual(["a.c"]);
  });

  it("returns a non-matching single segment when the query has no hits", () => {
    expect(splitHighlight("hello", "zzz")).toEqual([{ text: "hello", match: false }]);
  });
});
