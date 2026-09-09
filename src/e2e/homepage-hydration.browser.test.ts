import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser } from "playwright";
import AxeBuilder from "@axe-core/playwright";

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
    expect(ssr).toContain("عن قوستيشن");

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
    expect(bodyText).toContain("عن قوستيشن");

    // 4. No hydration mismatches or React errors in the console.
    const hydrationErrors = consoleErrors.filter((e) =>
      /hydrat|Minified React error|did not match/i.test(e),
    );
    expect(hydrationErrors, hydrationErrors.join("\n")).toEqual([]);

    // 5. Axe accessibility audit — no critical violations, with explicit
    //    focus on RTL layout and ARIA attribute rules.
    const results = await new AxeBuilder({ page: page as never })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    const summary = critical
      .map((v) => `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} nodes]`)
      .join("\n");
    expect(critical, `Axe critical violations:\n${summary}`).toEqual([]);

    // Targeted RTL + ARIA rules must always pass regardless of impact tuning.
    const rtlAriaRuleIds = new Set([
      "html-has-lang",
      "html-lang-valid",
      "html-xml-lang-mismatch",
      "valid-lang",
      "aria-valid-attr",
      "aria-valid-attr-value",
      "aria-required-attr",
      "aria-required-children",
      "aria-required-parent",
      "aria-roles",
      "aria-allowed-attr",
      "aria-hidden-body",
      "aria-hidden-focus",
    ]);
    const rtlAriaViolations = results.violations.filter((v) =>
      rtlAriaRuleIds.has(v.id),
    );
    expect(
      rtlAriaViolations,
      rtlAriaViolations.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([]);

    await context.close();
  }, 90_000);
});
