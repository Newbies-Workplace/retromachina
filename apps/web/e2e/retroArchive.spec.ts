import { expect, test } from "../playwright/fixtures";
import {
  createRetro,
  createTeam,
  createTeamWithMember,
  joinRetro,
} from "./helpers/retroSetup";
import { RetroActivePage } from "./pages/RetroActivePage";
import { RetroArchivePage } from "./pages/RetroArchivePage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

test("archive lists the running retro and then the finished one", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const retroId = await createRetro(firstUser.page, teamName);
  const archive = new RetroArchivePage(firstUser.page);

  await archive.gotoFromHome(teamName);
  await expect(archive.headerLocator).toBeVisible();
  await expect(archive.currentRetroLocator).toHaveCount(1);
  await expect(archive.finishedRetrosLocator).toHaveCount(0);

  await archive.currentRetroLocator.click();
  await expect(firstUser.page).toHaveURL(`/retro/${retroId}/reflection`);

  await new RetroActivePage(firstUser.page).finishRetro();

  await archive.gotoFromHome(teamName);
  await expect(archive.currentRetroLocator).toHaveCount(0);
  await expect(archive.finishedRetrosLocator).toHaveCount(1);
  await expect(archive.finishedRetrosLocator).toHaveText(
    /^Retro \d{2}\.\d{2}\.\d{4}$/,
  );

  await archive.finishedRetrosLocator.click();
  await expect(firstUser.page).toHaveURL(`/retro/${retroId}/summary`);
});

test("member can open the archive", async ({ firstUser, secondUser }) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const retroId = await createRetro(firstUser.page, teamName);
  await joinRetro(secondUser.page, retroId);

  const archive = new RetroArchivePage(secondUser.page);
  await archive.gotoFromHome(teamName);
  await expect(archive.headerLocator).toBeVisible();
  await expect(archive.currentRetroLocator).toHaveCount(1);
});

test("non-member is redirected away from the archive", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeam(firstUser.page);
  await new RetroArchivePage(firstUser.page).gotoFromHome(teamName);
  await expect(firstUser.page.getByTestId("archive-header")).toBeVisible();
  const archiveUrl = firstUser.page.url();

  await secondUser.page.goto(archiveUrl);
  await expect(secondUser.page).toHaveURL(/\/$/);
  await expect(secondUser.page.getByTestId("archive-header")).toHaveCount(0);
});
