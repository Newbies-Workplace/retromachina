import * as fs from "node:fs";
import {
  firstAuthFile,
  secondAuthFile,
  test as setup,
} from "../playwright/fixtures";

/**
 * Download Chrome for testing
 *
 * npx @puppeteer/browsers install chrome@stable
 *
 * Start Chrome with remote debugging enabled
 *
 * --remote-debugging-port=9222
 *
 * clear browser data before running each setup test
 *
 * replace page with setupBrowserPage
 */
setup("authenticate as first user", async ({ firstUser }) => {
  if (fs.existsSync(firstAuthFile)) {
    return;
  }

  throw new Error("first user authentication file is missing");
});

setup("authenticate as second user", async ({ secondUser }) => {
  if (fs.existsSync(secondAuthFile)) {
    return;
  }

  throw new Error("Second user authentication file is missing");
});
