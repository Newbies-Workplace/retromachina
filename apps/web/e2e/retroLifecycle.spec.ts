import type { Page } from "@playwright/test";
import { expect, test } from "../playwright/fixtures";
import {
  createRetro,
  createTeam,
  createTeamWithMember,
  joinRetro,
} from "./helpers/retroSetup";
import { HomePage } from "./pages/HomePage";
import { RetroActivePage } from "./pages/RetroActivePage";
import { RetroSummaryPage } from "./pages/RetroSummaryPage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

async function startRetroWithMember(admin: Page, member: Page) {
  const { teamName } = await createTeamWithMember(admin, member);
  const retroId = await createRetro(admin, teamName);
  await joinRetro(member, retroId);
  return { teamName, retroId };
}

async function addActionPoint(page: Page, text: string) {
  const input = page.getByPlaceholder("Nowy action point...");
  await input.fill(text);
  await input.press("Enter");
  await expect(page.getByText(text, { exact: true })).toBeVisible();
}

test.describe("phase navigation", () => {
  test("moves both users through phases and member has no controls", async ({
    firstUser,
    secondUser,
  }) => {
    await startRetroWithMember(firstUser.page, secondUser.page);
    const admin = new RetroActivePage(firstUser.page);
    const member = new RetroActivePage(secondUser.page);

    await expect(member.nextStageButtonLocator).toHaveCount(0);
    await expect(member.prevStageButtonLocator).toHaveCount(0);
    await expect(member.finishRetroButtonLocator).toHaveCount(0);

    await admin.createCard("Lifecycle card");
    for (const stage of ["group", "vote", "discuss"] as const) {
      await admin.gotoStage(stage);
      await expect(secondUser.page).toHaveURL(new RegExp(`/retro/.+/${stage}`));
    }
  });

  test("next-stage is disabled without cards", async ({ firstUser }) => {
    const { teamName } = await createTeam(firstUser.page);
    await createRetro(firstUser.page, teamName);
    const admin = new RetroActivePage(firstUser.page);

    await expect(admin.nextStageButtonLocator).toBeDisabled();
    await admin.createCard("A card");
    await expect(admin.nextStageButtonLocator).toBeEnabled();
  });

  test("prev-stage is disabled in reflection and returns from group", async ({
    firstUser,
  }) => {
    const { teamName } = await createTeam(firstUser.page);
    await createRetro(firstUser.page, teamName);
    const admin = new RetroActivePage(firstUser.page);

    await expect(admin.prevStageButtonLocator).toBeDisabled();
    await admin.createCard("A card");
    await admin.gotoStage("group");
    await admin.prevStage();
    await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  });
});

test.describe("timer", () => {
  test("admin adds 30 seconds and clears the timer", async ({ firstUser }) => {
    const { teamName } = await createTeam(firstUser.page);
    await createRetro(firstUser.page, teamName);
    const admin = new RetroActivePage(firstUser.page);

    await expect(admin.timerDisplayLocator).toHaveText("--:--");
    await firstUser.page.getByTestId("timer-add-30").click();
    await expect(admin.timerDisplayLocator).toHaveText(/^0:[23]\d$/);

    await firstUser.page.getByTestId("timer-clear").click();
    await expect(admin.timerDisplayLocator).toHaveText("--:--");
  });

  test("admin sets the timer via the popover", async ({ firstUser }) => {
    const { teamName } = await createTeam(firstUser.page);
    await createRetro(firstUser.page, teamName);
    const page = firstUser.page;
    const admin = new RetroActivePage(page);

    await admin.timerDisplayLocator.click();
    await page.getByTestId("timer-minutes").fill("2");
    await page.getByTestId("timer-seconds").fill("0");
    await page.getByTestId("timer-save").click();
    await expect(admin.timerDisplayLocator).toHaveText(/^[12]:\d\d$/);
  });

  test("timer syncs to the member who cannot control it", async ({
    firstUser,
    secondUser,
  }) => {
    await startRetroWithMember(firstUser.page, secondUser.page);
    const admin = new RetroActivePage(firstUser.page);
    const member = new RetroActivePage(secondUser.page);

    await expect(member.timerDisplayLocator).toHaveText("--:--");
    await expect(secondUser.page.getByTestId("timer-add-30")).toHaveCount(0);
    await expect(secondUser.page.getByTestId("timer-clear")).toHaveCount(0);

    await firstUser.page.getByTestId("timer-add-30").click();
    await expect(member.timerDisplayLocator).toHaveText(/^0:[23]\d$/);

    await member.timerDisplayLocator.click();
    await expect(secondUser.page.getByTestId("timer-minutes")).toHaveCount(0);

    await firstUser.page.getByTestId("timer-clear").click();
    await expect(admin.timerDisplayLocator).toHaveText("--:--");
    await expect(member.timerDisplayLocator).toHaveText("--:--");
  });

  test("changing phase clears the timer for everyone", async ({
    firstUser,
    secondUser,
  }) => {
    await startRetroWithMember(firstUser.page, secondUser.page);
    const admin = new RetroActivePage(firstUser.page);
    const member = new RetroActivePage(secondUser.page);

    await admin.createCard("Timer card");
    await firstUser.page.getByTestId("timer-add-30").click();
    await expect(member.timerDisplayLocator).toHaveText(/^0:[23]\d$/);

    await admin.gotoStage("group");
    await expect(admin.timerDisplayLocator).toHaveText("--:--");
    await expect(member.timerDisplayLocator).toHaveText("--:--");
  });
});

test.describe("finishing a retro", () => {
  test("declining the dialog keeps everyone in the retro", async ({
    firstUser,
  }) => {
    const { teamName } = await createTeam(firstUser.page);
    await createRetro(firstUser.page, teamName);
    const admin = new RetroActivePage(firstUser.page);

    await admin.finishRetroButtonLocator.click();
    await expect(
      firstUser.page.getByText("Zakończenie retrospektywy"),
    ).toBeVisible();
    await firstUser.page.getByTestId("confirm-dialog-no").click();
    await expect(firstUser.page.getByTestId("confirm-dialog-no")).toBeHidden();
    await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  });

  test("confirming sends both users to the summary and the retro redirects afterwards", async ({
    firstUser,
    secondUser,
  }) => {
    const { teamName, retroId } = await startRetroWithMember(
      firstUser.page,
      secondUser.page,
    );
    const admin = new RetroActivePage(firstUser.page);

    await admin.finishRetro();
    await expect(secondUser.page).toHaveURL(`/retro/${retroId}/summary`);
    await expect(firstUser.page).toHaveURL(`/retro/${retroId}/summary`);

    await firstUser.page.goto(`/retro/${retroId}/reflection`);
    await expect(firstUser.page).toHaveURL(`/retro/${retroId}/summary`);

    await new HomePage(firstUser.page).goto();
    const card = firstUser.page.getByTestId(`team-${teamName}`);
    await expect(card.getByTestId("create-retro")).toBeVisible();
    await expect(card.getByTestId("current-retro")).toHaveCount(0);
  });
});

test.describe("summary", () => {
  test("shows owner tasks, members without tasks and the back button", async ({
    firstUser,
    secondUser,
  }) => {
    await startRetroWithMember(firstUser.page, secondUser.page);
    const admin = new RetroActivePage(firstUser.page);

    await admin.createCard("Summary card");
    await admin.gotoStage("group");
    await admin.gotoStage("vote");
    await admin.gotoStage("discuss");

    const ownedTask = `Owned task ${Date.now()}`;
    await addActionPoint(firstUser.page, ownedTask);
    const unassignedTask = `Unassigned task ${Date.now()}`;
    await addActionPoint(firstUser.page, unassignedTask);
    const unassignedCard = firstUser.page
      .getByTestId("card")
      .filter({ hasText: unassignedTask });
    await unassignedCard.getByTestId("card-author").first().click();
    await firstUser.page
      .getByTestId("user-picker-option")
      .filter({ hasText: "Nieprzypisany" })
      .click();
    await expect(
      unassignedCard.getByTestId("card-author").first(),
    ).toContainText("Nieprzypisany");

    await admin.finishRetro();
    const summary = new RetroSummaryPage(firstUser.page);
    await expect(summary.headerLocator).toHaveText(
      /^Retro \d{2}\.\d{2}\.\d{4}$/,
    );
    await expect(firstUser.page.getByText(ownedTask)).toBeVisible();
    await expect(summary.noTasksLocator).toBeVisible();
    await expect(summary.unassignedHeaderLocator).toBeVisible();
    await expect(firstUser.page.getByText(unassignedTask)).toBeVisible();

    await summary.backButtonLocator.click();
    await expect(firstUser.page).toHaveURL(/\/team\/.+\/board/);
  });
});
