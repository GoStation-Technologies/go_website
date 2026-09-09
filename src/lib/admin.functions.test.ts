import { describe, it, expect } from "vitest";
import { ChatsInput, paginateSessions, validateChatsInput } from "./admin.pagination";

async function catchResponse(fn: () => unknown): Promise<Response> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  throw new Error("expected validateChatsInput to throw a Response, but it returned");
}

type ErrorBody = {
  error: string;
  message: string;
  fields: string[];
  fieldErrors: Record<string, string[]>;
};

describe("validateChatsInput — 400 Response error body shape", () => {
  it("returns parsed data (no throw) for valid input", () => {
    expect(validateChatsInput({ page: 2, pageSize: 25, sort: "oldest" })).toEqual({
      page: 2, pageSize: 25, sort: "oldest", q: "",
    });
    expect(validateChatsInput({})).toEqual({ page: 1, pageSize: 10, sort: "newest", q: "" });
  });

  const singleFieldCases: Array<{ label: string; input: unknown; field: "page" | "pageSize" | "sort" }> = [
    { label: "page=0",        input: { page: 0,   pageSize: 10, sort: "newest" }, field: "page" },
    { label: "page=-5",       input: { page: -5,  pageSize: 10, sort: "newest" }, field: "page" },
    { label: "page=1.5",      input: { page: 1.5, pageSize: 10, sort: "newest" }, field: "page" },
    { label: 'page="1"',      input: { page: "1", pageSize: 10, sort: "newest" }, field: "page" },
    { label: "pageSize=0",    input: { page: 1, pageSize: 0,      sort: "newest" }, field: "pageSize" },
    { label: "pageSize=101",  input: { page: 1, pageSize: 101,    sort: "newest" }, field: "pageSize" },
    { label: "pageSize=huge", input: { page: 1, pageSize: 999999, sort: "newest" }, field: "pageSize" },
    { label: "pageSize=2.5",  input: { page: 1, pageSize: 2.5,    sort: "newest" }, field: "pageSize" },
    { label: "sort=bogus",    input: { page: 1, pageSize: 10, sort: "bogus" }, field: "sort" },
    { label: "sort=empty",    input: { page: 1, pageSize: 10, sort: "" },      field: "sort" },
    { label: "sort=number",   input: { page: 1, pageSize: 10, sort: 123 },     field: "sort" },
  ];

  it.each(singleFieldCases)("single-field: $label → 400 with fieldErrors.$field populated", async ({ input, field }) => {
    const res = await catchResponse(() => validateChatsInput(input));

    // Response envelope
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toBe("application/json");

    const body = (await res.json()) as ErrorBody;

    // Exact top-level shape
    expect(Object.keys(body).sort()).toEqual(["error", "fieldErrors", "fields", "message"]);
    expect(body.error).toBe("invalid_input");
    expect(body.message).toBe("One or more pagination parameters are invalid.");

    // Only the offending field should be reported
    expect(body.fields).toEqual([field]);
    expect(Object.keys(body.fieldErrors)).toEqual([field]);

    const msgs = body.fieldErrors[field];
    expect(Array.isArray(msgs)).toBe(true);
    expect(msgs.length).toBeGreaterThan(0);
    for (const m of msgs) {
      expect(typeof m).toBe("string");
      expect(m.length).toBeGreaterThan(0);
    }
  });

  it("multi-field: reports every invalid field with non-empty messages", async () => {
    const res = await catchResponse(() =>
      validateChatsInput({ page: -1, pageSize: 0, sort: "bogus" }),
    );

    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toBe("application/json");

    const body = (await res.json()) as ErrorBody;

    expect(Object.keys(body).sort()).toEqual(["error", "fieldErrors", "fields", "message"]);
    expect(body.error).toBe("invalid_input");
    expect(body.message).toBe("One or more pagination parameters are invalid.");

    // All three offenders present (order-agnostic), and no extras
    expect(new Set(body.fields)).toEqual(new Set(["page", "pageSize", "sort"]));
    expect(new Set(Object.keys(body.fieldErrors))).toEqual(new Set(["page", "pageSize", "sort"]));

    for (const f of ["page", "pageSize", "sort"] as const) {
      const msgs = body.fieldErrors[f];
      expect(Array.isArray(msgs)).toBe(true);
      expect(msgs.length).toBeGreaterThan(0);
      expect(msgs.every((m) => typeof m === "string" && m.length > 0)).toBe(true);
    }

    // `fields` is derived from `fieldErrors` — keep them consistent
    expect([...body.fields].sort()).toEqual(Object.keys(body.fieldErrors).sort());
  });

  it("multi-field with two offenders leaves the valid field out of the error body", async () => {
    const res = await catchResponse(() =>
      validateChatsInput({ page: 0, pageSize: 500, sort: "newest" }),
    );
    const body = (await res.json()) as ErrorBody;

    expect(res.status).toBe(400);
    expect(new Set(body.fields)).toEqual(new Set(["page", "pageSize"]));
    expect(Object.keys(body.fieldErrors)).not.toContain("sort");
  });
});

describe("validateChatsInput — missing / undefined / null / non-numeric handling", () => {
  const DEFAULTS = { page: 1, pageSize: 10, sort: "newest" as const, q: "" };

  // Missing keys and `undefined` values must fall back to defaults, never 400.
  const defaultCases: Array<{ label: string; input: unknown }> = [
    { label: "missing: undefined input", input: undefined },
    { label: "missing: null input",      input: null }, // safeParse(null ?? {}) → {}
    { label: "missing: empty object",    input: {} },
    { label: "missing: page only",       input: { pageSize: 25, sort: "oldest" } },
    { label: "missing: pageSize only",   input: { page: 3, sort: "messages" } },
    { label: "missing: sort only",       input: { page: 2, pageSize: 5 } },
    { label: "undefined: page",          input: { page: undefined, pageSize: 25, sort: "oldest" } },
    { label: "undefined: pageSize",      input: { page: 3, pageSize: undefined, sort: "messages" } },
    { label: "undefined: sort",          input: { page: 2, pageSize: 5, sort: undefined } },
    { label: "undefined: all three",     input: { page: undefined, pageSize: undefined, sort: undefined } },
  ];

  it.each(defaultCases)("defaults: $label → parsed data, no throw", ({ input }) => {
    const parsed = validateChatsInput(input);
    // Merge defaults with any explicit values on the input for expectation
    const rec = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const expected = {
      page: rec.page === undefined ? DEFAULTS.page : rec.page,
      pageSize: rec.pageSize === undefined ? DEFAULTS.pageSize : rec.pageSize,
      sort: rec.sort === undefined ? DEFAULTS.sort : rec.sort,
      q: DEFAULTS.q,
    };
    expect(parsed).toEqual(expected);
  });

  // Null and non-numeric values on required-typed fields must produce the
  // structured 400 body — same shape as any other invalid input.
  const rejectCases: Array<{ label: string; input: unknown; fields: string[] }> = [
    { label: "null page",             input: { page: null,   pageSize: 10, sort: "newest" }, fields: ["page"] },
    { label: "null pageSize",         input: { page: 1, pageSize: null,   sort: "newest" }, fields: ["pageSize"] },
    { label: "null sort",             input: { page: 1, pageSize: 10, sort: null },          fields: ["sort"] },
    { label: "string page 'abc'",     input: { page: "abc", pageSize: 10, sort: "newest" }, fields: ["page"] },
    { label: "string page ''",        input: { page: "",    pageSize: 10, sort: "newest" }, fields: ["page"] },
    { label: "string pageSize 'ten'", input: { page: 1, pageSize: "ten",  sort: "newest" }, fields: ["pageSize"] },
    { label: "boolean page",          input: { page: true, pageSize: 10, sort: "newest" },  fields: ["page"] },
    { label: "array page",            input: { page: [1],  pageSize: 10, sort: "newest" },  fields: ["page"] },
    { label: "object pageSize",       input: { page: 1, pageSize: {},    sort: "newest" },  fields: ["pageSize"] },
    { label: "NaN page",              input: { page: NaN,  pageSize: 10, sort: "newest" },  fields: ["page"] },
    { label: "Infinity pageSize",     input: { page: 1, pageSize: Infinity, sort: "newest" }, fields: ["pageSize"] },
    { label: "number sort",           input: { page: 1, pageSize: 10, sort: 3 },             fields: ["sort"] },
    { label: "null page + non-numeric pageSize + bad sort",
      input: { page: null, pageSize: "x", sort: "bogus" }, fields: ["page", "pageSize", "sort"] },
    { label: "non-object input: string",  input: "not-an-object",  fields: ["_root"] },
    { label: "non-object input: number",  input: 42,               fields: ["_root"] },
    { label: "non-object input: boolean", input: true,             fields: ["_root"] },
    { label: "non-object input: array",   input: [1, 2, 3],        fields: ["_root"] },
  ];

  it.each(rejectCases)("rejects: $label → 400 with exact error body shape", async ({ input, fields }) => {
    const res = await catchResponse(() => validateChatsInput(input));

    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toBe("application/json");

    const body = (await res.json()) as ErrorBody;

    // Exact top-level shape — no extra keys, no missing keys.
    expect(Object.keys(body).sort()).toEqual(["error", "fieldErrors", "fields", "message"]);
    expect(body.error).toBe("invalid_input");
    expect(body.message).toBe("One or more pagination parameters are invalid.");

    // Order-agnostic field set; `fields` mirrors `fieldErrors` keys.
    expect(new Set(body.fields)).toEqual(new Set(fields));
    expect(new Set(Object.keys(body.fieldErrors))).toEqual(new Set(fields));
    expect([...body.fields].sort()).toEqual(Object.keys(body.fieldErrors).sort());

    // Every reported field carries at least one non-empty string message.
    for (const f of fields) {
      const msgs = body.fieldErrors[f];
      expect(Array.isArray(msgs)).toBe(true);
      expect(msgs.length).toBeGreaterThan(0);
      expect(msgs.every((m) => typeof m === "string" && m.length > 0)).toBe(true);
    }
  });
});


describe("adminListChats input validation (ChatsInput)", () => {
  it("applies defaults for empty input", () => {
    const parsed = ChatsInput.parse({});
    expect(parsed).toEqual({ page: 1, pageSize: 10, sort: "newest", q: "" });
  });

  it("accepts valid in-range values", () => {
    for (const sort of ["newest", "oldest", "messages"] as const) {
      const parsed = ChatsInput.parse({ page: 3, pageSize: 25, sort });
      expect(parsed).toEqual({ page: 3, pageSize: 25, sort, q: "" });
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
