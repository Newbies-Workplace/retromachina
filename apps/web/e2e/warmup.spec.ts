import { v4 as uuid } from "uuid";
import { expect, type Page, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { InvitationAcceptPage } from "./pages/InvitationAcceptPage";
import { RetroCreatePage } from "./pages/RetroCreatePage";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";
import { WarmupPage } from "./pages/WarmupPage";

test.use({
  permissions: ["clipboard-write", "clipboard-read"],
});

async function createTeamAndOpenRetroCreate(page: Page) {
  const teamName = `Warmup ${uuid()}`;
  const teamPage = new TeamCreatePage(page);
  await teamPage.goto();
  await teamPage.fillTeamName(teamName);
  await teamPage.saveTeam();
  await expect(page).toHaveURL("/");
  return openRetroCreate(page, teamName);
}

async function openRetroCreate(page: Page, teamName: string) {
  await new HomePage(page).gotoCreateRetro(teamName);
  await expect(page).toHaveURL(/\/retro\/create/);
  return new RetroCreatePage(page);
}

async function inviteSecondUserToTeam(
  firstPage: Page,
  secondPage: Page,
  teamName: string,
) {
  const teamCreate = new TeamCreatePage(firstPage);
  await teamCreate.goto();
  await teamCreate.fillTeamName(teamName);
  await teamCreate.generateInvitationLink();
  const invitationLink = await teamCreate.copyInvitationLink();
  await teamCreate.saveTeam();

  await secondPage.goto(invitationLink);
  await new InvitationAcceptPage(secondPage).acceptInvitation();
  await expect(secondPage).toHaveURL(/\/.*\/board/);
  const notificationStream = secondPage.waitForResponse(
    (response) =>
      response.url().endsWith("/notifications/events") &&
      response.status() === 200,
  );
  await new HomePage(secondPage).goto();
  await notificationStream;
}

async function joinRetroNotification(
  secondPage: Page,
  teamName: string,
  retroId: string,
) {
  await expect(
    secondPage.getByText(`Rozpoczęto retrospektywę zespołu ${teamName}`),
  ).toBeVisible();
  await secondPage.getByRole("button", { name: "Dołącz" }).click();
  await expect(secondPage).toHaveURL(`/retro/${retroId}/warmup`);
}

test("skips the warmup by default when creating a retro", async ({
  firstUser,
}) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.createRetro();

  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  await expect(firstUser.page.getByTestId("warmup-sidebar-title")).toHaveCount(
    0,
  );
});

test("can draw the default random warmup after creating a retro", async ({
  firstUser,
}) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.chooseRandomWarmup();
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);

  const warmup = new WarmupPage(firstUser.page);
  await expect(warmup.sidebarTitleLocator).toHaveText("Nie wybrano rozgrzewki");
  await warmup.startDraw();
  await expect(warmup.spinningLocator).toBeVisible();
  await warmup.waitForResult();
  await expect(warmup.sidebarTitleLocator).not.toHaveText(
    "Nie wybrano rozgrzewki",
  );
});

test("warmup wheel has an accessible name", async ({ firstUser }) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.chooseWarmup("Gartic Phone");
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);

  const warmup = new WarmupPage(firstUser.page);
  await expect(warmup.wheelLocator).toBeVisible();
  await expect(warmup.sidebarTitleLocator).toHaveText("Gartic Phone");
});

test("shows a single spinning status until the result is revealed", async ({
  firstUser,
}) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.chooseRandomWarmup();
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);

  const warmup = new WarmupPage(firstUser.page);
  await expect(warmup.resultLocator).toHaveCount(0);
  await warmup.startDraw();
  await expect(
    firstUser.page.getByText("Losowanie trwa…", { exact: true }),
  ).toHaveCount(1);
  await expect(warmup.resultLocator).toHaveCount(0);
  await warmup.waitForResult();
  await expect(warmup.spinningLocator).toHaveCount(0);
});

test("draw and reroll actions are only available in the appropriate states", async ({
  firstUser,
}) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.chooseWarmup("GIPHY");
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);

  const warmup = new WarmupPage(firstUser.page);
  await expect(warmup.startButtonLocator).toBeVisible();
  await expect(warmup.rerollButtonLocator).toHaveCount(0);
  await warmup.startDraw();
  await expect(warmup.startButtonLocator).toHaveCount(0);
  await expect(warmup.rerollButtonLocator).toHaveCount(0);
  await warmup.waitForResult();
  await expect(warmup.startButtonLocator).toHaveCount(0);
  await expect(warmup.rerollButtonLocator).toBeVisible();

  await warmup.reroll();
  await expect(warmup.startButtonLocator).toHaveCount(0);
  await expect(warmup.rerollButtonLocator).toHaveCount(0);
  await warmup.waitForResult();
  await expect(warmup.rerollButtonLocator).toBeVisible();
});

test("can open a room-required warmup after sharing its room link", async ({
  firstUser,
}) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.chooseWarmup("Gartic Phone");
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);

  const warmup = new WarmupPage(firstUser.page);
  await warmup.startDraw();
  await warmup.waitForResult();
  await expect(warmup.sidebarTitleLocator).toHaveText("Gartic Phone");
  await expect(warmup.roomFormLocator).toBeVisible();
  await expect(warmup.openLinkButtonLocator).toBeDisabled();

  await warmup.openLinkButtonLocator.hover({ force: true });
  await expect(
    firstUser.page.getByText(
      "Poczekaj, aż prowadzący założy pokój i udostępni link.",
    ),
  ).toBeVisible();

  const roomUrl = `https://example.test/room/${uuid()}`;
  await warmup.shareRoomLink(roomUrl);
  await expect(warmup.openLinkButtonLocator).toBeEnabled();
  await firstUser.page.mouse.move(0, 0);
  await warmup.openLinkButtonLocator.hover({ force: true });
  await expect(
    firstUser.page.getByText(
      `Otwórz: ${roomUrl.replace(/^https?:\/\/(www\.)?/i, "")}`,
    ),
  ).toBeVisible();

  await firstUser.page
    .context()
    .route("https://example.test/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "room" }),
    );
  const openedPage = firstUser.page.context().waitForEvent("page");
  await warmup.openLinkButtonLocator.click();
  await expect(await openedPage).toHaveURL(roomUrl);

  await firstUser.page
    .getByRole("button", { name: "Przejdź do retrospektywy" })
    .click();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  await firstUser.page.getByRole("button", { name: "Poprzedni etap" }).click();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);
});

test("GIPHY can be opened without creating a room", async ({ firstUser }) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.chooseWarmup("GIPHY");
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);

  const warmup = new WarmupPage(firstUser.page);
  await warmup.startDraw();
  await warmup.waitForResult();
  await expect(warmup.sidebarTitleLocator).toHaveText("GIPHY");
  await expect(warmup.roomFormLocator).toHaveCount(0);
  await expect(warmup.openLinkButtonLocator).toBeEnabled();

  await firstUser.page
    .context()
    .route("https://giphy.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "giphy" }),
    );
  const openedPage = firstUser.page.context().waitForEvent("page");
  await warmup.openLinkButtonLocator.click();
  await expect(await openedPage).toHaveURL("https://giphy.com/");
});

test("reroll clears a previously shared room link", async ({ firstUser }) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.chooseWarmup("Gartic Phone");
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);

  const warmup = new WarmupPage(firstUser.page);
  await warmup.startDraw();
  await warmup.waitForResult();
  const firstResult = await warmup.sidebarTitleLocator.textContent();
  expect(firstResult).toBe("Gartic Phone");

  await warmup.shareRoomLink(`https://example.test/room/${uuid()}`);
  await expect(warmup.openLinkButtonLocator).toBeEnabled();

  await warmup.reroll();
  await warmup.waitForResult();
  await expect(warmup.sidebarTitleLocator).not.toHaveText(firstResult ?? "");
  if ((await warmup.sidebarTitleLocator.textContent()) === "GIPHY") {
    await expect(warmup.roomFormLocator).toHaveCount(0);
    await expect(warmup.openLinkButtonLocator).toBeEnabled();
  } else {
    await expect(warmup.roomFormLocator).toBeVisible();
    await expect(warmup.openLinkButtonLocator).toBeDisabled();
  }
});

test("team members can follow a warmup draw but cannot control it", async ({
  firstUser,
  secondUser,
}) => {
  const teamName = `Warmup member ${uuid()}`;
  await inviteSecondUserToTeam(firstUser.page, secondUser.page, teamName);

  const createRetro = await openRetroCreate(firstUser.page, teamName);
  await createRetro.chooseWarmup("Gartic Phone");
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);
  const retroId = firstUser.page.url().match(/\/retro\/([^/]+)/)?.[1];
  if (!retroId)
    throw new Error("Created retro URL does not contain a retro ID");

  await joinRetroNotification(secondUser.page, teamName, retroId);

  const adminWarmup = new WarmupPage(firstUser.page);
  const memberWarmup = new WarmupPage(secondUser.page);
  await expect(memberWarmup.startButtonLocator).toHaveCount(0);
  await expect(memberWarmup.rerollButtonLocator).toHaveCount(0);
  await expect(memberWarmup.openLinkButtonLocator).toBeDisabled();
  await adminWarmup.startDraw();
  await memberWarmup.spinningLocator.waitFor({ state: "visible" });
  await memberWarmup.waitForResult();
  await expect(memberWarmup.sidebarTitleLocator).toHaveText("Gartic Phone");
  await expect(memberWarmup.roomFormLocator).toHaveCount(0);
  await expect(memberWarmup.startButtonLocator).toHaveCount(0);
  await expect(memberWarmup.rerollButtonLocator).toHaveCount(0);
});

test("warmup result survives navigation to reflection and back", async ({
  firstUser,
}) => {
  const createRetro = await createTeamAndOpenRetroCreate(firstUser.page);
  await createRetro.chooseWarmup("Gartic Phone");
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);

  const warmup = new WarmupPage(firstUser.page);
  await warmup.startDraw();
  await warmup.waitForResult();
  await firstUser.page
    .getByRole("button", { name: "Przejdź do retrospektywy" })
    .click();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  await firstUser.page.getByRole("button", { name: "Poprzedni etap" }).click();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);
  await expect(warmup.sidebarTitleLocator).toHaveText("Gartic Phone");
});

test("shared room links become available to other retro participants", async ({
  firstUser,
  secondUser,
}) => {
  const teamName = `Warmup shared link ${uuid()}`;
  await inviteSecondUserToTeam(firstUser.page, secondUser.page, teamName);
  const createRetro = await openRetroCreate(firstUser.page, teamName);
  await createRetro.chooseWarmup("Gartic Phone");
  await createRetro.createRetro({ skipWarmup: false });
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/warmup/);
  const retroId = firstUser.page.url().match(/\/retro\/([^/]+)/)?.[1];
  if (!retroId)
    throw new Error("Created retro URL does not contain a retro ID");
  await joinRetroNotification(secondUser.page, teamName, retroId);

  const adminWarmup = new WarmupPage(firstUser.page);
  const memberWarmup = new WarmupPage(secondUser.page);
  await adminWarmup.startDraw();
  await adminWarmup.waitForResult();
  const roomUrl = `https://example.test/room/${uuid()}`;
  await adminWarmup.shareRoomLink(roomUrl);

  await expect(memberWarmup.openLinkButtonLocator).toBeEnabled();
  await expect(memberWarmup.roomFormLocator).toHaveCount(0);
  await secondUser.page
    .context()
    .route("https://example.test/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "room" }),
    );
  const openedPage = secondUser.page.context().waitForEvent("page");
  await memberWarmup.openLinkButtonLocator.click();
  await expect(await openedPage).toHaveURL(roomUrl);
});
