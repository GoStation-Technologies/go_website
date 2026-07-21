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

async function fetchHome(lang: "en" | "ar"): Promise<{ status: number; html: string }> {
  const res = await fetch(BASE_URL + "/", {
    headers: { "accept-language": lang, cookie: `i18nextLng=${lang}` },
  });
  return { status: res.status, html: await res.text() };
}

describe("SSR homepage smoke", () => {
  for (const lang of ["en", "ar"] as const) {
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
});
