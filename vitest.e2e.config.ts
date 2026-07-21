import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/e2e/**/*.test.ts"],
    // Browser-based tests (Playwright) run under a separate config so the
    // fast fetch-based smoke suite doesn't require chromium to be installed.
    exclude: ["src/e2e/**/*.browser.test.ts", "node_modules/**"],
    testTimeout: 30_000,
  },
});
