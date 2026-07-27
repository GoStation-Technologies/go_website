import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.E2E_URL ?? "http://localhost:8080";
const SITE_URL = "https://org-story-weaver.lovable.app";

const ROUTES = [
  "/",
  "/about",
  "/stations",
  "/media",
  "/careers",
  "/investors",
  "/contact",
  "/franchise",
  "/acquisitions",
];

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);
afterAll(async () => {
  await browser?.close();
});

type Head = {
  titles: string[];
  descriptions: string[];
  canonicals: string[];
  ogUrls: string[];
  ogTitles: string[];
  ogTypes: string[];
  h1s: number;
  jsonLd: string[];
};

async function readHead(page: Page): Promise<Head> {
  return page.evaluate(() => {
    const attrs = (sel: string, attr: string) =>
      Array.from(document.querySelectorAll(sel)).map((el) => el.getAttribute(attr) ?? "");
    return {
      titles: Array.from(document.querySelectorAll("title")).map((el) => el.textContent ?? ""),
      descriptions: attrs('meta[name="description"]', "content"),
      canonicals: attrs('link[rel="canonical"]', "href"),
      ogUrls: attrs('meta[property="og:url"]', "content"),
      ogTitles: attrs('meta[property="og:title"]', "content"),
      ogTypes: attrs('meta[property="og:type"]', "content"),
      h1s: document.querySelectorAll("h1").length,
      jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
        (el) => el.textContent ?? "",
      ),
    };
  });
}

function assertHead(head: Head, path: string) {
  const expectedUrl = `${SITE_URL}${path}`;

  expect(head.titles, `${path}: <title> count`).toHaveLength(1);
  expect(head.titles[0].trim().length, `${path}: title not empty`).toBeGreaterThan(0);

  expect(head.descriptions, `${path}: description count`).toHaveLength(1);
  expect(head.descriptions[0].trim().length, `${path}: description not empty`).toBeGreaterThan(0);

  expect(head.canonicals, `${path}: canonical count`).toHaveLength(1);
  expect(head.canonicals[0], `${path}: canonical self-references`).toBe(expectedUrl);

  expect(head.ogUrls, `${path}: og:url count`).toHaveLength(1);
  expect(head.ogUrls[0], `${path}: og:url self-references`).toBe(expectedUrl);

  expect(head.ogTitles, `${path}: og:title count`).toHaveLength(1);
  expect(head.ogTypes, `${path}: og:type count`).toHaveLength(1);
  expect(["website", "article"], `${path}: og:type value`).toContain(head.ogTypes[0]);

  expect(head.h1s, `${path}: exactly one H1`).toBe(1);

  expect(head.jsonLd.length, `${path}: has JSON-LD`).toBeGreaterThan(0);
  for (const raw of head.jsonLd) {
    let parsed: unknown;
    expect(() => {
      parsed = JSON.parse(raw);
    }, `${path}: JSON-LD parses`).not.toThrow();
    const blocks = Array.isArray(parsed) ? parsed : [parsed];
    for (const block of blocks as Record<string, unknown>[]) {
      expect(block["@context"], `${path}: JSON-LD @context`).toBe("https://schema.org");
      expect(typeof block["@type"], `${path}: JSON-LD @type`).toBe("string");
    }
  }
}

describe("public route SEO metadata", () => {
  for (const path of ROUTES) {
    it(
      `${path} has exactly one canonical, one og:url and valid JSON-LD`,
      async () => {
        const page = await browser.newPage();
        try {
          await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
          assertHead(await readHead(page), path);
        } finally {
          await page.close();
        }
      },
      60_000,
    );
  }

  it(
    "article pages have a single self-referencing canonical and NewsArticle JSON-LD",
    async () => {
      const page = await browser.newPage();
      try {
        await page.goto(BASE_URL + "/media", { waitUntil: "networkidle" });
        const href = await page
          .locator('a[href^="/media/"]')
          .first()
          .getAttribute("href")
          .catch(() => null);
        if (!href) {
          console.warn("No published articles found — skipping article SEO assertions.");
          return;
        }
        await page.goto(BASE_URL + href, { waitUntil: "networkidle" });
        const head = await readHead(page);
        assertHead(head, href);
        expect(head.ogTypes[0]).toBe("article");
        const types = head.jsonLd.map((raw) => (JSON.parse(raw) as { "@type": string })["@type"]);
        expect(types).toContain("NewsArticle");
      } finally {
        await page.close();
      }
    },
    60_000,
  );

  it("titles and descriptions are unique across routes", async () => {
    const page = await browser.newPage();
    const titles: string[] = [];
    const descriptions: string[] = [];
    try {
      for (const path of ROUTES) {
        await page.goto(BASE_URL + path, { waitUntil: "domcontentloaded" });
        const head = await readHead(page);
        titles.push(head.titles[0]);
        descriptions.push(head.descriptions[0]);
      }
    } finally {
      await page.close();
    }
    expect(new Set(titles).size, "unique titles").toBe(titles.length);
    expect(new Set(descriptions).size, "unique descriptions").toBe(descriptions.length);
  }, 120_000);
});
