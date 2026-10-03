import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  use: {
    baseURL: `http://localhost:${port}`,
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" } }],
  webServer: {
    command: `npx next start -p ${port}`,
    port,
    reuseExistingServer: false,
    env: {
      ALLOW_DEV_ADAPTERS: "true",
      DEV_DATA_DIR: ".data/e2e",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
      MIN_FORM_SECONDS: "0",
      UPLOAD_TOKEN_SECRET: "e2e-secret",
      CRON_SECRET: "e2e-cron",
    },
  },
});
