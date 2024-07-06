import { expect, test } from "../playwright/fixtures";

test("has title", async ({ firstUser }) => {
  await firstUser.page.goto("/");

  await expect(firstUser.page).toHaveTitle(/Retromachina/);
});
