import { describe, it, expect } from "vitest";

const BASE_URL = process.env.E2E_URL ?? "http://localhost:8080";

// Strip <script>/<style> and tags, collapse whitespace, return visible text length.
function visibleTextLength(html: string): number {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length;
}

async function fetchHome(lang: string): Promise<{ status: number; html: string }> {
  const res = await fetch(BASE_URL + "/", {
    headers: { "accept-language": lang, cookie: `i18nextLng=${lang}` },
  });
  return { status: res.status, html: await res.text() };
}

// Supported languages render in their own locale; unsupported ones must
// gracefully fall back to English without producing a blank SSR shell.
const SUPPORTED = ["en", "ar"] as const;
const FALLBACK = ["fr", "de", "es", "zh-CN", "ja", "pt-BR", "ru", "hi"] as const;
const ALL_LANGS = [...SUPPORTED, ...FALLBACK];

describe("SSR homepage smoke", () => {
  for (const lang of ALL_LANGS) {
    it(`renders non-blank SSR HTML for ${lang}`, async () => {
      const { status, html } = await fetchHome(lang);
      expect(status).toBe(200);
      // Must not be an h3-swallowed error body
      expect(html).not.toMatch(/"unhandled"\s*:\s*true/);
      // Must have a <body> with substantial rendered markup (not a blank shell)
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      expect(bodyMatch, "missing <body> in SSR HTML").toBeTruthy();
      expect(bodyMatch![1].length, "empty <body>").toBeGreaterThan(500);
      // Must have meaningful visible text
      expect(visibleTextLength(html)).toBeGreaterThan(200);
      // Must render a document title
      expect(html).toMatch(/<title>[^<]+<\/title>/);
    }, 30_000);
  }

  // RTL / Arabic-specific: with the `gs_lang=ar` cookie, SSR must render
  // Arabic content directly (no client-only i18n hydration hop) and ship an
  // <html lang="ar" dir="rtl"> shell so the layout doesn't flash LTR.
  it("renders Arabic content and RTL shell under SSR for ar", async () => {
    const { status, html } = await fetchHome("ar");
    expect(status).toBe(200);
    expect(html).not.toMatch(/"unhandled"\s*:\s*true/);

    // RTL-ready shell straight from the server.
    expect(html).toMatch(/<html[^>]*\blang="ar"/i);
    expect(html).toMatch(/<html[^>]*\bdir="rtl"/i);

    // Layout landmarks are present (RTL didn't collapse the tree).
    expect(html).toMatch(/<header[\s>]/i);
    expect(html).toMatch(/<main[\s>]/i);
    expect(html).toMatch(/<footer[\s>]/i);

    // Contains Arabic script characters (rules out an English fallback).
    const arabicChars = html.match(/\p{Script=Arabic}/gu) ?? [];
    expect(arabicChars.length, "no Arabic characters in SSR HTML").toBeGreaterThan(50);

    // Brand + key nav labels from the ar locale render server-side.
    expect(html).toContain("قوستيشن"); // brand.name
    expect(html).toContain("عن قوستيشن"); // nav.about
    expect(html).toContain("المحطات"); // nav.stations
    expect(html).toContain("تواصل معنا"); // nav.contact

    // No React SSR error markers.
    expect(html).not.toMatch(/Minified React error/i);
    expect(html).not.toMatch(/Cannot read propert(y|ies) of undefined/i);
  }, 30_000);

  // Baseline: default (no cookie) SSR renders in English.
  it("renders an LTR English shell by default", async () => {
    const res = await fetch(BASE_URL + "/");
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toMatch(/<html[^>]*\blang="en"/i);
    expect(html).toMatch(/<html[^>]*\bdir="ltr"/i);
  }, 30_000);
});

