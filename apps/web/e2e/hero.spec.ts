import { expect, test } from "../playwright/fixtures";

test.describe("unauthorized user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("is redirected to hero", async ({ page }) => {
    await expect(page).toHaveURL("/hero");
  });

  test("can navigate to sign in page", async ({ page }) => {
    await page.getByRole("button", { name: "Dołącz", exact: true }).click();

    await expect(page).toHaveURL("/signin");
  });
});

test.describe("authorized user", () => {
  test("is not redirected to hero page", async ({ firstUser }) => {
    await firstUser.page.goto("/");

    await expect(firstUser.page).toHaveURL("/");
  });

  test("can navigate to home page", async ({ firstUser }) => {
    await firstUser.page.goto("/hero");

    await firstUser.page
      .getByRole("button", { name: "Dołącz", exact: true })
      .click();

    await expect(firstUser.page).toHaveURL("/");
  });
});
