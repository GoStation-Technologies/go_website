import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser } from "playwright";

const BASE_URL = process.env.E2E_URL ?? "http://localhost:8080";

let browser: Browser;
beforeAll(async () => { browser = await chromium.launch(); }, 60_000);
afterAll(async () => { await browser?.close(); });

describe("Arabic homepage hydration", () => {
  it("keeps dir=rtl and Arabic content after hydration, matching SSR", async () => {
    // 1. Fetch raw SSR HTML with the ar cookie.
    const ssr = await fetch(BASE_URL + "/", {
      headers: { cookie: "gs_lang=ar", "accept-language": "ar" },
    }).then((r) => r.text());
    expect(ssr).toMatch(/<html[^>]*\bdir="rtl"/i);
    expect(ssr).toContain("قوستيشن");
    expect(ssr).toContain("من نحن");

    // 2. Load the same page in a real browser with the same cookie so
    //    per-request lang detection picks Arabic on the SSR pass, then
    //    React hydrates.
    const context = await browser.newContext({
      locale: "ar",
      extraHTTPHeaders: { "accept-language": "ar" },
    });
    const url = new URL(BASE_URL);
    await context.addCookies([
      { name: "gs_lang", value: "ar", domain: url.hostname, path: "/" },
    ]);
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });

    // 3. After hydration, <html> attributes and Arabic content must persist.
    const htmlDir = await page.getAttribute("html", "dir");
    const htmlLang = await page.getAttribute("html", "lang");
    expect(htmlDir).toBe("rtl");
    expect(htmlLang).toBe("ar");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain("قوستيشن");
    expect(bodyText).toContain("من نحن");

    // 4. No hydration mismatches or React errors in the console.
    const hydrationErrors = consoleErrors.filter((e) =>
      /hydrat|Minified React error|did not match/i.test(e),
    );
    expect(hydrationErrors, hydrationErrors.join("\n")).toEqual([]);

    await context.close();
  }, 60_000);
});
