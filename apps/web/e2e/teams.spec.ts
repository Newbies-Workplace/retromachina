import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";
import { TeamEditPage } from "./pages/team_form/TeamEditPage";

let teamName: string;

test.beforeEach(async ({ firstUser }) => {
  teamName = uuid();

  const teamCreatePage = new TeamCreatePage(firstUser.page);
  await teamCreatePage.goto();
  await teamCreatePage.fillTeamName(teamName);
  await teamCreatePage.fillTeamUsers([{ email: "retromachina2@gmail.com" }]);
  await teamCreatePage.saveTeam();

  await expect(firstUser.page).toHaveURL("/");
});

test("can create a team", async ({ firstUser }) => {
  await expect(firstUser.page).toHaveURL("/");
  await expect(firstUser.page.getByText(teamName)).toBeVisible();
});

test("can edit a team name", async ({ firstUser }) => {
  const updatedTeamName = uuid();

  const homePage = new HomePage(firstUser.page);
  await homePage.gotoEditTeam(teamName);
  const teamEditPage = new TeamEditPage(firstUser.page);
  await teamEditPage.fillTeamName(updatedTeamName);
  await teamEditPage.saveTeam();

  await expect(firstUser.page).toHaveURL("/");
  await expect(firstUser.page.getByText(updatedTeamName)).toBeVisible();
});

test("can remove a team", async ({ firstUser }) => {
  const homePage = new HomePage(firstUser.page);
  await homePage.gotoEditTeam(teamName);
  const teamEditPage = new TeamEditPage(firstUser.page);
  await teamEditPage.removeTeam();

  await expect(firstUser.page).toHaveURL("/");
  await expect(firstUser.page.getByText(teamName)).not.toBeVisible();
});
