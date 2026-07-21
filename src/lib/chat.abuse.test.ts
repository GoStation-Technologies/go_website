import { describe, it, expect, beforeEach } from "vitest";
import {
  messageLooksAbusive,
  checkIpRate,
  extractIp,
  __resetIpStore,
  LIMITS,
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

describe("checkIpRate", () => {
  beforeEach(() => __resetIpStore());
  it("allows within limits", () => {
    expect(checkIpRate("1.1.1.1")).toBeNull();
  });
  it("blocks after per-minute cap", () => {
    const now = Date.now();
    for (let i = 0; i < LIMITS.perIpPerMinute; i++) checkIpRate("2.2.2.2", now);
    expect(checkIpRate("2.2.2.2", now)).toBe("ip_minute");
  });
  it("ignores empty ip", () => {
    expect(checkIpRate("")).toBeNull();
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
