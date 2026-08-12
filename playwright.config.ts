import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ??
      "https://mandate-web-production.up.railway.app",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
