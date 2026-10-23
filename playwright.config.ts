import { defineConfig, devices } from "@playwright/test";
import { loadSupabaseEnv } from "./e2e/support/env";

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const isCi = Boolean(process.env.CI);
const supabase = loadSupabaseEnv();

export default defineConfig({
  testDir: "./e2e/specs",
  outputDir: "./e2e/test-results",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: isCi
    ? [["list"], ["html", { outputFolder: "e2e/playwright-report", open: "never" }]]
    : [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "fr-FR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !isCi,
    timeout: 240_000,
    env: {
      VITE_SUPABASE_URL: supabase.apiUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: supabase.publishableKey,
    },
  },
});
