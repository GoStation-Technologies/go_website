import { describe, it, expect } from "vitest";
import { ChatsInput, paginateSessions } from "./admin.functions";

describe("adminListChats input validation (ChatsInput)", () => {
  it("applies defaults for empty input", () => {
    const parsed = ChatsInput.parse({});
    expect(parsed).toEqual({ page: 1, pageSize: 10, sort: "newest" });
  });

  it("accepts valid in-range values", () => {
    for (const sort of ["newest", "oldest", "messages"] as const) {
      const parsed = ChatsInput.parse({ page: 3, pageSize: 25, sort });
      expect(parsed).toEqual({ page: 3, pageSize: 25, sort });
    }
    expect(ChatsInput.parse({ pageSize: 1 }).pageSize).toBe(1);
    expect(ChatsInput.parse({ pageSize: 100 }).pageSize).toBe(100);
  });

  it("rejects non-integer / non-positive page", () => {
    expect(() => ChatsInput.parse({ page: 0 })).toThrow();
    expect(() => ChatsInput.parse({ page: -1 })).toThrow();
    expect(() => ChatsInput.parse({ page: 1.5 })).toThrow();
    expect(() => ChatsInput.parse({ page: "1" })).toThrow();
  });

  it("rejects pageSize out of [1,100]", () => {
    expect(() => ChatsInput.parse({ pageSize: 0 })).toThrow();
    expect(() => ChatsInput.parse({ pageSize: 101 })).toThrow();
    expect(() => ChatsInput.parse({ pageSize: 999999 })).toThrow();
    expect(() => ChatsInput.parse({ pageSize: -5 })).toThrow();
    expect(() => ChatsInput.parse({ pageSize: 2.5 })).toThrow();
  });

  it("rejects unknown sort values", () => {
    expect(() => ChatsInput.parse({ sort: "bogus" })).toThrow();
    expect(() => ChatsInput.parse({ sort: "" })).toThrow();
    expect(() => ChatsInput.parse({ sort: 123 })).toThrow();
  });
});

describe("paginateSessions — consistent pageCount/total/page clamping", () => {
  const make = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i }));

  it("clamps huge page down to the last page", () => {
    const all = make(13);
    const r = paginateSessions(all, 99999, 5);
    expect(r.total).toBe(13);
    expect(r.pageSize).toBe(5);
    expect(r.pageCount).toBe(3);
    expect(r.page).toBe(3);
    expect(r.sessions).toHaveLength(3); // 13 - (3-1)*5
  });

  it("clamps page <= 0 to 1", () => {
    const all = make(13);
    const r = paginateSessions(all, 0, 5);
    expect(r.page).toBe(1);
    expect(r.sessions).toHaveLength(5);
    const r2 = paginateSessions(all, -50, 5);
    expect(r2.page).toBe(1);
  });

  it("returns pageCount=1 and empty sessions for total=0", () => {
    const r = paginateSessions([], 5, 10);
    expect(r.total).toBe(0);
    expect(r.pageCount).toBe(1);
    expect(r.page).toBe(1);
    expect(r.sessions).toEqual([]);
  });

  it("pageCount math holds across pageSizes and totals are invariant", () => {
    const all = make(47);
    for (const size of [1, 5, 10, 25, 50, 100]) {
      const r = paginateSessions(all, 1, size);
      expect(r.total).toBe(47);
      expect(r.pageCount).toBe(Math.ceil(47 / size));
    }
  });

  it("last page contains total - (pageCount-1)*pageSize items", () => {
    const totals = [1, 10, 11, 13, 47, 100];
    const sizes = [1, 5, 10, 25];
    for (const t of totals) {
      for (const s of sizes) {
        const r = paginateSessions(make(t), 99999, s);
        const expected = t === 0 ? 0 : t - (r.pageCount - 1) * s;
        expect(r.sessions).toHaveLength(expected);
        expect(r.page).toBe(r.pageCount);
      }
    }
  });

  it("walking every page yields exactly total items, no duplicates", () => {
    const all = make(37);
    const size = 7;
    const seen = new Set<number>();
    const r1 = paginateSessions(all, 1, size);
    for (let p = 1; p <= r1.pageCount; p++) {
      const r = paginateSessions(all, p, size);
      expect(r.total).toBe(37);
      expect(r.pageCount).toBe(r1.pageCount);
      for (const item of r.sessions) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
    }
    expect(seen.size).toBe(37);
  });
});
