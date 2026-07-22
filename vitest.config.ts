import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    exclude: ["node_modules", "dist", ".output", "src/e2e/**"],
    environmentMatchGlobs: [["src/**/*.dom.test.{ts,tsx}", "jsdom"]],
  },
});
