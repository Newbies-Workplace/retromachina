import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { RetroActivePage } from "./pages/RetroActivePage";
import { RetroCreatePage } from "./pages/RetroCreatePage";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";

test.beforeEach(async ({ firstUser }) => {
  const teamName = uuid();
  const teamCreatePage = new TeamCreatePage(firstUser.page);
  await teamCreatePage.goto();
  await teamCreatePage.fillTeamName(teamName);
  await teamCreatePage.saveTeam();

  await new HomePage(firstUser.page).gotoCreateRetro(teamName);
  const createRetroPage = new RetroCreatePage(firstUser.page);
  await createRetroPage.replaceColumns([
    { name: "First", description: "First description" },
    { name: "Second", description: "Second description" },
    { name: "Third", description: "Third description" },
  ]);
  await createRetroPage.createRetro();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
});

test("can reorder columns during reflection", async ({ firstUser }) => {
  const retro = new RetroActivePage(firstUser.page);

  await retro.reorderColumn(0, 2);
  await expect
    .poll(() => retro.getColumnTitles())
    .toEqual(["Second", "Third", "First"]);

  await firstUser.page.reload();
  await expect
    .poll(() => retro.getColumnTitles())
    .toEqual(["Second", "Third", "First"]);
});

test("can change a column title during reflection", async ({ firstUser }) => {
  const retro = new RetroActivePage(firstUser.page);
  await retro.editColumnTitle(0, "Updated title");

  await firstUser.page.reload();
  await expect(
    retro.columnsLocator.nth(0).getByTestId("column-title"),
  ).toHaveText("Updated title");
});

test("can change and clear a column description during reflection", async ({
  firstUser,
}) => {
  const retro = new RetroActivePage(firstUser.page);

  await retro.editColumnDescription(0, "Updated description");
  await retro.editColumnDescription(0, "");

  await firstUser.page.reload();
  await expect(
    retro.columnsLocator.nth(0).getByTestId("column-description"),
  ).toHaveText("Dodaj opis");
});
