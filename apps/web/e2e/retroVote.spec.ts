import { expect, test } from "../playwright/fixtures";
import {
  createRetro,
  createTeam,
  createTeamWithMember,
  joinRetro,
} from "./helpers/retroSetup";
import { VotePage } from "./pages/VotePage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

async function startVoting(admin: VotePage) {
  for (const [i, text] of ["Alpha", "Beta", "Gamma"].entries()) {
    await admin.createCard(text, i % 2);
  }
  await admin.gotoStage("group");
  await admin.gotoStage("vote");
}

async function soloVoting(page: import("@playwright/test").Page) {
  const { teamName } = await createTeam(page);
  await createRetro(page, teamName);
  const vote = new VotePage(page);
  await startVoting(vote);
  return vote;
}

test("adds and removes votes and tracks votes left", async ({ firstUser }) => {
  const vote = await soloVoting(firstUser.page);

  await expect(vote.votesLeftLocator).toContainText("3/3");
  await expect(vote.removeButton("Alpha")).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  await vote.addVote("Alpha", 1);
  await expect(vote.votesLeftLocator).toContainText("2/3");
  await vote.addVote("Alpha", 2);
  await vote.addVote("Beta", 1);
  await expect(vote.votesLeftLocator).toContainText("0/3");

  await vote.removeVote("Alpha", 1);
  await expect(vote.votesLeftLocator).toContainText("1/3");
  await vote.removeVote("Alpha", 0);
  await expect(vote.votesLeftLocator).toContainText("2/3");
  await expect(vote.removeButton("Alpha")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("cannot exceed the vote limit", async ({ firstUser }) => {
  const vote = await soloVoting(firstUser.page);

  await vote.addVote("Alpha", 1);
  await vote.addVote("Alpha", 2);
  await vote.addVote("Alpha", 3);
  await expect(vote.addButton("Alpha")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(vote.addButton("Beta")).toHaveAttribute("aria-disabled", "true");

  await vote.addButton("Beta").click({ force: true });
  await vote.addButton("Alpha").click({ force: true });
  await expect(vote.voteCount("Beta")).toHaveText("0");
  await expect(vote.voteCount("Alpha")).toHaveText("3");
  await expect(vote.votesLeftLocator).toContainText("0/3");
});

test("votes persist after reload", async ({ firstUser }) => {
  const vote = await soloVoting(firstUser.page);

  await vote.addVote("Alpha", 1);
  await vote.addVote("Alpha", 2);
  await vote.addVote("Beta", 1);

  await firstUser.page.reload();
  await expect(vote.voteCount("Alpha")).toHaveText("2");
  await expect(vote.voteCount("Beta")).toHaveText("1");
  await expect(vote.voteCount("Gamma")).toHaveText("0");
  await expect(vote.votesLeftLocator).toContainText("0/3");
});

test("votes of one user are not counted for another", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const retroId = await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await startVoting(admin);
  await joinRetro(secondUser.page, retroId);
  const member = new VotePage(secondUser.page);
  await expect(member.voteCount("Alpha")).toBeVisible();

  await admin.addVote("Alpha", 1);
  await member.addVote("Beta", 1);
  await expect(member.voteCount("Alpha")).toHaveText("0");
  await expect(admin.voteCount("Beta")).toHaveText("0");
  await expect(member.votesLeftLocator).toContainText("2/3");
  await expect(admin.votesLeftLocator).toContainText("2/3");
});

test("admin changes the vote limit", async ({ firstUser }) => {
  const vote = await soloVoting(firstUser.page);

  await vote.setVoteLimit(5);
  await expect(vote.votesLeftLocator).toContainText("5/5");
  for (let n = 1; n <= 5; n++) {
    await vote.addVote("Alpha", n);
  }
  await expect(vote.addButton("Alpha")).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  await vote.setVoteLimit(2);
  await expect(vote.votesLeftLocator).toContainText("0/2");
  await expect(vote.voteCount("Alpha")).toHaveText("2");
  await expect(vote.addButton("Alpha")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("lowering the limit trims votes of other users", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const retroId = await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await startVoting(admin);
  await joinRetro(secondUser.page, retroId);
  const member = new VotePage(secondUser.page);

  await member.addVote("Alpha", 1);
  await member.addVote("Beta", 1);
  await member.addVote("Gamma", 1);
  await expect(member.votesLeftLocator).toContainText("0/3");

  await admin.setVoteLimit(1);
  await expect(member.votesLeftLocator).toContainText("0/1");
  await expect
    .poll(async () => {
      const counts = await Promise.all(
        ["Alpha", "Beta", "Gamma"].map((t) =>
          member.voteCount(t).textContent(),
        ),
      );
      return counts.reduce((sum, c) => sum + Number(c), 0);
    })
    .toBe(1);

  await admin.setVoteLimit(4);
  await expect(member.votesLeftLocator).toContainText("3/4");
});

test("member has no vote limit control or navigation", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const retroId = await createRetro(firstUser.page, teamName);
  const admin = new VotePage(firstUser.page);
  await startVoting(admin);
  await joinRetro(secondUser.page, retroId);
  const member = new VotePage(secondUser.page);

  await expect(member.votesLeftLocator).toBeVisible();
  await expect(admin.voteLimitLocator).toBeVisible();
  await expect(member.voteLimitLocator).toHaveCount(0);
  await expect(member.nextStageButtonLocator).toHaveCount(0);
  await expect(member.prevStageButtonLocator).toHaveCount(0);
});
