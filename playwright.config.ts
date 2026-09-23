import { defineConfig, devices } from "@playwright/test";

// Browser tests for the playground. Unit tests (vitest, tests/*.test.ts) check
// geometry; these check that the library actually RENDERS — a WebGL canvas with
// no console errors — which no unit test can see.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Headless Chrome renders WebGL in software: the heavier pages (streamlines,
  // SDF) need well over the 30 s default, more so on CI hardware.
  timeout: 90_000,
  // Each test holds a live WebGL context; too many at once and Chrome starts
  // dropping them (a page then renders no canvas). Four is comfortable.
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:5199",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite playground --port 5199 --strictPort",
    url: "http://localhost:5199",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
