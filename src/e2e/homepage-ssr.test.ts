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

  // RTL / Arabic-specific: SSR for `ar` must not crash and must ship a fully
  // formed document shell so client-side hydration (LangBoot) can flip
  // <html dir="rtl" lang="ar"> without layout thrash or missing landmarks.
  // Note: content localization happens client-side (i18next detects language
  // in the browser), so SSR text is still the English fallback — that's by
  // design. These assertions cover the "page doesn't break" contract.
  it("renders a stable, RTL-ready SSR shell for ar", async () => {
    const { status, html } = await fetchHome("ar");
    expect(status).toBe(200);
    expect(html).not.toMatch(/"unhandled"\s*:\s*true/);

    // Full document skeleton is present.
    expect(html).toMatch(/<html[^>]*>/i);
    expect(html).toMatch(/<head[\s>]/i);
    expect(html).toMatch(/<body[^>]*>/i);

    // Layout landmarks render (header/main/footer didn't collapse under ar).
    expect(html).toMatch(/<header[\s>]/i);
    expect(html).toMatch(/<main[\s>]/i);
    expect(html).toMatch(/<footer[\s>]/i);

    // Homepage hero + nav render enough content to hydrate against.
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    expect(bodyMatch).toBeTruthy();
    expect(bodyMatch![1].length).toBeGreaterThan(1000);

    // Title tag present so <head> merge won't blow up on hydration.
    expect(html).toMatch(/<title>[^<]+<\/title>/);

    // No React SSR error markers that would indicate a broken tree.
    expect(html).not.toMatch(/Minified React error/i);
    expect(html).not.toMatch(/Cannot read propert(y|ies) of undefined/i);
  }, 30_000);
});

