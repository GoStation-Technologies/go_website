import { describe, it, expect } from "vitest";
import {
  messageLooksAbusive,
  extractIp,
  checkPersistentRate,
} from "./chat.abuse";

describe("messageLooksAbusive", () => {
  it("allows normal messages", () => {
    expect(messageLooksAbusive("Hello, where is the nearest station?")).toBeNull();
  });
  it("blocks too many urls", () => {
    const m = "check https://a.com https://b.com https://c.com https://d.com";
    expect(messageLooksAbusive(m)).toBe("too_many_urls");
  });
  it("blocks repeated char flooding", () => {
    expect(messageLooksAbusive("a".repeat(60))).toBe("blocked_content");
  });
  it("blocks script tags", () => {
    expect(messageLooksAbusive("hi <script>alert(1)</script>")).toBe("blocked_content");
  });
});

describe("extractIp", () => {
  it("prefers cf-connecting-ip", () => {
    const h = new Headers({ "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" });
    expect(extractIp(h)).toBe("9.9.9.9");
  });
  it("falls back to x-forwarded-for first entry", () => {
    const h = new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
    expect(extractIp(h)).toBe("1.1.1.1");
  });
  it("returns empty when no headers", () => {
    expect(extractIp(new Headers())).toBe("");
  });
});

describe("checkPersistentRate", () => {
  const mkRpc = (
    rows: Array<{ allowed: boolean; current_count: number; reset_at: string }> | null,
    error: unknown = null,
  ) => ({
    rpc: async () => ({ data: rows, error }),
  });

  it("returns allowed when RPC row says so", async () => {
    const r = await checkPersistentRate(
      mkRpc([{ allowed: true, current_count: 3, reset_at: "2030-01-01T00:00:00Z" }]),
      "ip:1.1.1.1:minute",
      60,
      30,
    );
    expect(r.allowed).toBe(true);
    expect(r.count).toBe(3);
  });

  it("returns blocked when RPC row denies", async () => {
    const r = await checkPersistentRate(
      mkRpc([{ allowed: false, current_count: 31, reset_at: "2030-01-01T00:00:00Z" }]),
      "ip:1.1.1.1:minute",
      60,
      30,
    );
    expect(r.allowed).toBe(false);
  });

  it("fails open when RPC errors", async () => {
    const r = await checkPersistentRate(mkRpc(null, new Error("boom")), "k", 60, 10);
    expect(r.allowed).toBe(true);
  });
});
