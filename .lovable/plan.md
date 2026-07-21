## Goal

Add a small unit test that locks in the SSR-safe behavior of the language detection helpers, so a future regression can't reintroduce the `Cannot read properties of undefined (reading 'startsWith')` crash.

## Approach

Test the pure helpers in `src/lib/i18n.ts` (`getContentLanguage`, `isRtl`) directly — they are the single choke point every caller (`LangBoot`, `SiteHeader`, `FuelTicker`, etc.) goes through. No React/SSR harness needed; if these are safe, the render path is safe.

## Steps

1. Add dev dep: `vitest` (already common in TanStack templates — verify in `package.json` first; only install if missing).
2. Create `src/lib/i18n.test.ts` with cases:
   - `getContentLanguage(undefined)` → `"en"` (does not throw)
   - `getContentLanguage(null)` → `"en"`
   - `getContentLanguage("")` → `"en"`
   - `getContentLanguage(123)` → `"en"` (non-string)
   - `getContentLanguage("ar")` → `"ar"`
   - `getContentLanguage("ar-SA")` → `"ar"`
   - `getContentLanguage("en-US")` → `"en"`
   - `isRtl(undefined)` → `false` (does not throw) — this is the exact SSR regression
   - `isRtl("ar-SA")` → `true`
3. Add a `test` script to `package.json` if not present (`vitest run`).
4. Run the test once to confirm green.

## Technical notes

- No SSR/DOM mocking required — helpers are pure.
- Keeps the test suite tiny and fast; runs in Node.
- If `vitest` isn't already configured, minimal setup: add `vitest` devDep, `"test": "vitest run"` script. No config file needed for a single pure-function test.

## Out of scope

- Full SSR render test of routes (heavier; the helper-level test catches the actual regression class).
- Refactoring the helpers.