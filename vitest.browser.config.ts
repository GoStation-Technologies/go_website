import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/e2e/**/*.browser.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
