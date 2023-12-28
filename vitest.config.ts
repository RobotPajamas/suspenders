import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.{test,spec}.{js,ts}"],
    mockReset: true,
    setupFiles: "./tests/setup-vitest.ts",
  },
});
