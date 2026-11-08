import * as process from "node:process";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Several specs drive timing-sensitive UI (animations, drag and drop);
  // high local parallelism against the dev server makes them flaky.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  timeout: 30_000,
  projects: [
    // Setup project
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    // Cleanup project, only on demand (`npm run test:cleanup`): it deletes
    // UUID-named teams and would race with tests running in parallel.
    ...(process.env.E2E_CLEANUP
      ? [
          {
            name: "cleanup",
            testMatch: /.*\.cleanup\.ts/,
            dependencies: ["setup"],
          },
        ]
      : []),

    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: process.env.CI
      ? "cd ../.. && npm run start"
      : "cd ../.. && npm run dev",
    port: 8080,
    reuseExistingServer: !process.env.CI,
    stdout: process.env.CI ? "pipe" : "ignore",
    stderr: "pipe",
    // All test traffic comes from one IP, which would trip the API rate limits.
    env: { RATE_LIMIT_DISABLED: "true" },
  },
});
