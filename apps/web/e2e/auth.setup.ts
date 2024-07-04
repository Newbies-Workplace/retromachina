import {
  Page,
  firstAuthFile,
  secondAuthFile,
  test as setup,
} from "../playwright/fixtures";

import * as fs from "node:fs";

setup("authenticate as first user", async ({ page }) => {
  if (fs.existsSync(firstAuthFile)) {
    // await page.context().storageState({ path: firstAuthFile });
    return;
  }

  await authenticateWithCredentials(
    page,
    process.env.E2E_FIRST_LOGIN,
    process.env.E2E_FIRST_PASSWORD,
  );

  await page.context().storageState({ path: firstAuthFile });
});

setup("authenticate as second user", async ({ page }) => {
  if (fs.existsSync(secondAuthFile)) {
    // await page.context().storageState({ path: secondAuthFile });
    return;
  }

  await authenticateWithCredentials(
    page,
    process.env.E2E_SECOND_LOGIN,
    process.env.E2E_SECOND_PASSWORD,
  );

  await page.context().storageState({ path: secondAuthFile });
});

const authenticateWithCredentials = async (
  page: Page,
  login: string,
  password: string,
) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Sign in with Google" }).click();
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', login);
  await page.click("#identifierNext");
  await page.waitForSelector('input[type="password"]', {
    state: "visible",
  });
  await page.fill('input[type="password"]', password);
  await page.waitForSelector("#passwordNext", {
    state: "visible",
  });
  await page.click("#passwordNext");
  await page.getByRole("button", { name: "Allow" }).click();

  await page.waitForURL("/");
};
