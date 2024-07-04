import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { TeamCreatePage } from "./pages/TeamCreatePage";

test("has title", async ({ firstUser }) => {
  await firstUser.page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(firstUser.page).toHaveTitle(/Retromachina/);
});

test("can create a team", async ({ firstUser }) => {
  const teamName = uuid();

  await firstUser.page.goto("/");

  const teamCreatePage = new TeamCreatePage(firstUser.page);

  await teamCreatePage.goto();
  await teamCreatePage.createTeam(teamName, [
    { email: "retromachina2@gmail.com" },
  ]);

  await expect(firstUser.page).toHaveURL("/");
  await expect(firstUser.page.getByText(teamName)).toBeVisible();
});
