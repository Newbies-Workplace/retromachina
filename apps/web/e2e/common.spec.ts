import { expect, test } from "../playwright/fixtures";

test("has title", async ({ firstUser }) => {
  await firstUser.page.goto("/");

  await expect(firstUser.page).toHaveTitle(/Retromachina/);
});

test("contains privacy policy", async ({ page }) => {
  await page.goto("/privacy");

  await page.getByRole("heading", { name: "Polityka Prywatności" }).isVisible();
});
