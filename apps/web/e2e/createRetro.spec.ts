import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { RetroCreatePage } from "./pages/RetroCreatePage";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";

let teamName: string;

test.beforeEach(async ({ firstUser }) => {
  teamName = uuid();
  const teamCreatePage = new TeamCreatePage(firstUser.page);
  await teamCreatePage.goto();
  await teamCreatePage.fillTeamName(teamName);
  await teamCreatePage.saveTeam();

  await expect(firstUser.page).toHaveURL("/");

  const homePage = new HomePage(firstUser.page);
  await homePage.gotoCreateRetro(teamName);

  await expect(firstUser.page).toHaveURL(/\/retro\/create/);
});

test("can randomize template", async ({ firstUser }) => {
  const createRetroPage = new RetroCreatePage(firstUser.page);
  const columnsBefore = await createRetroPage.getColumns();
  await createRetroPage.randomizeTemplate();
  const columnsAfter = await createRetroPage.getColumns();

  expect(columnsBefore).not.toEqual(columnsAfter);
});

test("can create a retro", async ({ firstUser }) => {
  const createRetroPage = new RetroCreatePage(firstUser.page);
  const columns = await createRetroPage.getColumns();
  await createRetroPage.createRetro();

  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  for (const column of columns) {
    await firstUser.page.getByText(column.name).isVisible();
  }
});

test("current retro button is visible", async ({ firstUser }) => {
  const createRetroPage = new RetroCreatePage(firstUser.page);
  await createRetroPage.createRetro();

  const homePage = new HomePage(firstUser.page);
  await homePage.goto();

  await homePage.gotoCurrentRetro(teamName);
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
});
