import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { RetroActivePage } from "./pages/RetroActivePage";
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

test("can edit columns before creating a retro", async ({ firstUser }) => {
  const createRetroPage = new RetroCreatePage(firstUser.page);
  await createRetroPage.replaceColumns([
    { name: "Start", description: "Initial description" },
    { name: "Stop", description: "Description to clear" },
  ]);

  const columns = firstUser.page.getByTestId("column-create");
  await columns.nth(0).getByTestId("column-name").fill("Continue");
  await columns
    .nth(0)
    .getByTestId("column-description")
    .fill("Updated description");
  await columns.nth(1).getByTestId("column-description").fill("");

  await expect
    .poll(() => createRetroPage.getColumns())
    .toEqual([
      { name: "Continue", description: "Updated description" },
      { name: "Stop", description: "" },
    ]);

  await createRetroPage.createRetro();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  const retro = new RetroActivePage(firstUser.page);
  await expect
    .poll(() => retro.getColumnTitles())
    .toEqual(["Continue", "Stop"]);
  await expect(
    retro.columnsLocator.nth(0).getByTestId("column-description"),
  ).toHaveText("Updated description");
  await expect(
    retro.columnsLocator.nth(1).getByTestId("column-description"),
  ).toHaveText("Dodaj opis");
});

test("can reorder columns before creating a retro", async ({ firstUser }) => {
  const createRetroPage = new RetroCreatePage(firstUser.page);
  await createRetroPage.replaceColumns([
    { name: "First" },
    { name: "Second" },
    { name: "Third" },
  ]);

  await createRetroPage.reorderColumn(0, 2);

  await expect
    .poll(() => createRetroPage.getColumns())
    .toEqual([
      { name: "Second", description: "" },
      { name: "Third", description: "" },
      { name: "First", description: "" },
    ]);

  await createRetroPage.createRetro();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  await expect
    .poll(() => new RetroActivePage(firstUser.page).getColumnTitles())
    .toEqual(["Second", "Third", "First"]);
});
