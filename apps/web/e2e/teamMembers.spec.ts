import { expect, test } from "../playwright/fixtures";
import { createTeam, createTeamWithMember } from "./helpers/retroSetup";
import { HomePage } from "./pages/HomePage";
import { TeamEditPage } from "./pages/team_form/TeamEditPage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

const FIRST = "e2e-first@retromachina.test";
const SECOND = "e2e-second@retromachina.test";

test("owner adds an existing user who then sees the team", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeam(firstUser.page);
  await new HomePage(firstUser.page).gotoEditTeam(teamName);
  const edit = new TeamEditPage(firstUser.page);
  await edit.waitForMembers();

  await edit.addMember(SECOND);
  await expect(edit.memberRow(SECOND)).toBeVisible();
  await edit.saveTeam();
  await expect(firstUser.page).toHaveURL("/");

  await secondUser.page.goto("/");
  await expect(secondUser.page.getByTestId(`team-${teamName}`)).toBeVisible();
});

test("adding a duplicate email shows an error", async ({ firstUser }) => {
  const { teamName } = await createTeam(firstUser.page);
  await new HomePage(firstUser.page).gotoEditTeam(teamName);
  const edit = new TeamEditPage(firstUser.page);
  await edit.waitForMembers();

  await edit.addMember(FIRST);

  await expect(
    firstUser.page.getByText("Użytkownik o podanym adresie email już istnieje"),
  ).toBeVisible();
  await expect(edit.memberRow(FIRST)).toHaveCount(1);
});

test("unknown email becomes a pending invite", async ({ firstUser }) => {
  const { teamName } = await createTeam(firstUser.page);
  await new HomePage(firstUser.page).gotoEditTeam(teamName);
  const edit = new TeamEditPage(firstUser.page);
  await edit.waitForMembers();
  const email = `unknown-${Date.now()}@retromachina.test`;

  await edit.addMember(email);

  await expect(edit.memberRow(email)).toBeVisible();
  await expect(edit.newEmailLocator).toHaveValue("");
});

test("owner can promote and demote a member", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  const card = secondUser.page.getByTestId(`team-${teamName}`);
  await new HomePage(secondUser.page).goto();
  await expect(card).toBeVisible();
  await expect(card.getByTestId("edit-team")).toHaveCount(0);
  await expect(card.getByTestId("create-retro")).toHaveCount(0);

  await new HomePage(firstUser.page).goto();
  await new HomePage(firstUser.page).gotoEditTeam(teamName);
  const edit = new TeamEditPage(firstUser.page);
  await edit.waitForMembers();
  const roleSelect = edit.memberRow(SECOND).getByTestId("member-role-select");

  await edit.changeMemberRole(SECOND, "Administrator");
  await expect(roleSelect).toContainText("Administrator");

  await secondUser.page.reload();
  await expect(card.getByTestId("edit-team")).toBeVisible();
  await expect(card.getByTestId("create-retro")).toBeVisible();

  await edit.changeMemberRole(SECOND, "Użytkownik");
  await expect(roleSelect).toContainText("Użytkownik");

  await secondUser.page.reload();
  await expect(card).toBeVisible();
  await expect(card.getByTestId("edit-team")).toHaveCount(0);
  await expect(card.getByTestId("create-retro")).toHaveCount(0);
});

test("own role select is disabled and cannot be removed", async ({
  firstUser,
}) => {
  const { teamName } = await createTeam(firstUser.page);
  await new HomePage(firstUser.page).gotoEditTeam(teamName);
  const edit = new TeamEditPage(firstUser.page);
  await edit.waitForMembers();

  const row = edit.memberRow(FIRST);
  await expect(row.getByTestId("member-role-select")).toBeDisabled();
  await expect(row.getByTestId("remove-user")).toHaveCount(0);
});

test("owner removes a member and the team disappears for them", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  await secondUser.page.goto("/");
  await expect(secondUser.page.getByTestId(`team-${teamName}`)).toBeVisible();

  await new HomePage(firstUser.page).goto();
  await new HomePage(firstUser.page).gotoEditTeam(teamName);
  const edit = new TeamEditPage(firstUser.page);
  await edit.waitForMembers();
  await edit.removeMember(SECOND);
  await expect(edit.memberRow(SECOND)).toHaveCount(0);

  await secondUser.page.reload();
  await expect(secondUser.page.getByTestId(`team-${teamName}`)).toHaveCount(0);
});

test("a plain member sees members read-only on the team edit page", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  await new HomePage(firstUser.page).gotoEditTeam(teamName);
  const teamId = firstUser.page.url().match(/\/team\/([^/]+)/)?.[1];
  expect(teamId).toBeTruthy();

  // edit-team is hidden on Home for USER; check what direct URL access offers
  await secondUser.page.goto(`/team/${teamId}/edit`);
  const edit = new TeamEditPage(secondUser.page);
  await edit.waitForMembers();
  await expect(edit.memberRow(FIRST)).toBeVisible();
  await expect(edit.memberRow(FIRST).getByTestId("remove-user")).toHaveCount(0);
  await expect(
    edit.memberRow(FIRST).getByTestId("member-role-select"),
  ).toBeDisabled();
  await expect(
    edit.memberRow(SECOND).getByTestId("member-role-select"),
  ).toBeDisabled();
});
