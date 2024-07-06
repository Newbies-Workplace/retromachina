import { test } from "../playwright/fixtures";

test("contains privacy policy", async ({ page }) => {
  await page.goto("/privacy");

  await page.getByRole("heading", { name: "Polityka Prywatności" }).isVisible();
});
