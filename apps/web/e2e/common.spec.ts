import { expect, test } from "../playwright/fixtures";

test("has title", async ({ firstUser }) => {
  await firstUser.page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(firstUser.page).toHaveTitle(/Retromachina/);
});
