import { expect, test } from "../playwright/fixtures";
import {
  createRetro,
  createTeam,
  createTeamWithMember,
  joinRetro,
} from "./helpers/retroSetup";
import { DiscussPage } from "./pages/DiscussPage";
import { HomePage } from "./pages/HomePage";
import { VotePage } from "./pages/VotePage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

/** Alpha: 2 votes, Beta: 1, Gamma: 0 -> discussion order Alpha, Beta, Gamma. */
async function setupVoted(admin: VotePage) {
  for (const [i, text] of ["Alpha", "Beta", "Gamma"].entries()) {
    await admin.createCard(text, i % 2);
  }
  await admin.gotoStage("group");
  await admin.gotoStage("vote");
  await admin.addVote("Alpha", 1);
  await admin.addVote("Alpha", 2);
  await admin.addVote("Beta", 1);
}

test("starts with the most voted topic and orders the sidebar", async ({
  firstUser,
}) => {
  const { teamName } = await createTeam(firstUser.page);
  await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await setupVoted(admin);
  await admin.gotoStage("discuss");

  const discuss = new DiscussPage(firstUser.page);
  await expect(discuss.currentTopicLabel).toBeVisible();
  await expect(discuss.currentTopic()).toContainText("Alpha");
  await expect(discuss.currentTopic()).toContainText("2 głosy");

  const sidebar = discuss.upcomingSidebar();
  await expect(sidebar).toContainText("Beta");
  await expect(sidebar).toContainText("Gamma");
  await expect(sidebar).not.toContainText("Alpha");
  const text = (await sidebar.textContent()) ?? "";
  expect(text.indexOf("Beta")).toBeLessThan(text.indexOf("Gamma"));
});

test("badge is shown only to voters of the topic", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const retroId = await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await admin.createCard("Alpha", 0);
  await admin.createCard("Beta", 1);
  await admin.gotoStage("group");
  await admin.gotoStage("vote");
  await joinRetro(secondUser.page, retroId);
  const memberVote = new VotePage(secondUser.page);

  await admin.addVote("Alpha", 1);
  await admin.addVote("Alpha", 2);
  await memberVote.addVote("Beta", 1);

  await admin.gotoStage("discuss");
  const adminDiscuss = new DiscussPage(firstUser.page);
  const memberDiscuss = new DiscussPage(secondUser.page);
  await expect(secondUser.page).toHaveURL(/\/discuss/);

  await expect(adminDiscuss.currentTopic()).toContainText("Alpha");
  await expect(memberDiscuss.currentTopic()).toContainText("Alpha");
  await expect(adminDiscuss.votedBadge).toBeVisible();
  await expect(memberDiscuss.votedBadge).toHaveCount(0);

  await admin.nextStage();
  await expect(memberDiscuss.currentTopic()).toContainText("Beta");
  await expect(memberDiscuss.votedBadge).toBeVisible();
  await expect(adminDiscuss.votedBadge).toHaveCount(0);
});

test("action point lifecycle: create, edit, owner, unassign, delete", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const retroId = await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await admin.createCard("Alpha", 0);
  await admin.gotoStage("group");
  await admin.gotoStage("vote");
  await admin.addVote("Alpha", 1);
  await admin.gotoStage("discuss");
  await joinRetro(secondUser.page, retroId);
  await expect(secondUser.page).toHaveURL(/\/discuss/);

  const discuss = new DiscussPage(firstUser.page);
  const other = new DiscussPage(secondUser.page);

  await discuss.createActionPoint("Do the thing");
  await expect(other.actionPointWithText("Do the thing")).toBeVisible();
  await expect(
    discuss.actionPointWithText("Do the thing").getByTestId("card-author"),
  ).not.toContainText("Nieprzypisany");

  await discuss.editActionPoint("Do the thing", "Do the other thing");
  await expect(other.actionPointWithText("Do the other thing")).toBeVisible();
  await expect(other.actionPointWithText("Do the thing")).toHaveCount(0);

  const apAuthor = (page: DiscussPage) =>
    page.actionPointWithText("Do the other thing").getByTestId("card-author");

  // The current owner (creator) is excluded from the picker, so the only
  // named option is the other team member.
  await apAuthor(discuss).click();
  const options = firstUser.page.getByTestId("user-picker-option");
  await expect(options).toHaveCount(2);
  const named = options.filter({ hasNotText: "Nieprzypisany" });
  const newOwner = (await named.locator("span").last().textContent())?.trim();
  expect(newOwner).toBeTruthy();
  await named.click();
  await expect(apAuthor(other)).toContainText(newOwner as string);
  await expect(apAuthor(other)).not.toContainText("Nieprzypisany");

  await discuss.setOwner("Do the other thing", "Nieprzypisany");
  await expect(apAuthor(other)).toContainText("Nieprzypisany");
  await expect(discuss.actionPointWithText("Do the other thing")).toHaveCount(
    1,
    {
      timeout: 3000,
    },
  );
  await expect(apAuthor(discuss)).toContainText("Nieprzypisany");

  await discuss
    .actionPointWithText("Do the other thing")
    .getByTestId("card-delete")
    .click();
  await expect(discuss.actionPointWithText("Do the other thing")).toHaveCount(
    0,
  );
  await expect(other.actionPointWithText("Do the other thing")).toHaveCount(0);
});

test("shows only action points of the current topic", async ({ firstUser }) => {
  const { teamName } = await createTeam(firstUser.page);
  await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await setupVoted(admin);
  await admin.gotoStage("discuss");
  const discuss = new DiscussPage(firstUser.page);

  await expect(discuss.currentTopic()).toContainText("Alpha");
  await discuss.createActionPoint("AP for alpha");

  await admin.nextStage();
  await expect(discuss.currentTopic()).toContainText("Beta");
  await expect(discuss.actionPointWithText("AP for alpha")).toHaveCount(0);
  await discuss.createActionPoint("AP for beta");

  await admin.nextStage();
  await expect(discuss.currentTopic()).toContainText("Gamma");
  await expect(discuss.actionPoints).toHaveCount(0);
  await expect(admin.nextStageButtonLocator).toBeDisabled();

  await admin.prevStage();
  await expect(discuss.currentTopic()).toContainText("Beta");
  await expect(discuss.actionPointWithText("AP for beta")).toBeVisible();
  await expect(discuss.actionPointWithText("AP for alpha")).toHaveCount(0);

  await admin.prevStage();
  await expect(discuss.currentTopic()).toContainText("Alpha");
  await expect(discuss.actionPointWithText("AP for alpha")).toBeVisible();
});

test("prev on the first topic returns to the vote phase", async ({
  firstUser,
}) => {
  const { teamName } = await createTeam(firstUser.page);
  await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await setupVoted(admin);
  await admin.gotoStage("discuss");
  await admin.prevStage();
  await expect(firstUser.page).toHaveURL(/\/vote/);
  await expect(admin.voteCount("Alpha")).toHaveText("2");
});

test("member cannot navigate topics", async ({ firstUser, secondUser }) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const retroId = await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await setupVoted(admin);
  await admin.gotoStage("discuss");
  await joinRetro(secondUser.page, retroId);
  const member = new DiscussPage(secondUser.page);
  await expect(secondUser.page).toHaveURL(/\/discuss/);
  await expect(member.currentTopic()).toContainText("Alpha");
  await expect(member.nextStageButtonLocator).toHaveCount(0);
  await expect(member.prevStageButtonLocator).toHaveCount(0);
});

test("action point appears as a task on the team board", async ({
  firstUser,
}) => {
  const { teamName } = await createTeam(firstUser.page);
  await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await admin.createCard("Alpha", 0);
  await admin.gotoStage("group");
  await admin.gotoStage("vote");
  await admin.addVote("Alpha", 1);
  await admin.gotoStage("discuss");
  const discuss = new DiscussPage(firstUser.page);
  await discuss.createActionPoint("Board task from retro");

  const home = new HomePage(firstUser.page);
  await home.goto();
  await home.gotoTaskList(teamName);
  await expect(firstUser.page).toHaveURL(/\/team\/.+\/board/);
  await expect(
    firstUser.page
      .getByTestId("card")
      .filter({ hasText: "Board task from retro" }),
  ).toBeVisible();
});
