import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { InvitationAcceptPage } from "./pages/InvitationAcceptPage";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";
import { TeamEditPage } from "./pages/team_form/TeamEditPage";

test.use({
  permissions: ["clipboard-write", "clipboard-read"],
});

let teamName: string;
let invitationLink: string;

test.beforeEach(async ({ firstUser }) => {
  teamName = uuid();
  const teamCreatePage = new TeamCreatePage(firstUser.page);
  await teamCreatePage.goto();
  await teamCreatePage.fillTeamName(teamName);
  await teamCreatePage.generateInvitationLink();

  invitationLink = await teamCreatePage.copyInvitationLink();

  await teamCreatePage.saveTeam();
});

test("can accept invitation", async ({ secondUser }) => {
  const secondUserInvitePage = new InvitationAcceptPage(secondUser.page);
  await secondUser.page.goto(invitationLink);
  await secondUserInvitePage.acceptInvitation();

  await expect(secondUser.page).toHaveURL(/\/.*\/board/);
});

test("can accept regenerated invitation", async ({ firstUser, secondUser }) => {
  const homePage = new HomePage(firstUser.page);
  await homePage.gotoEditTeam(teamName);

  const teamEditPage = new TeamEditPage(firstUser.page);
  await teamEditPage.regenerateInvitationLink();
  const regeneratedInvitationLink = await teamEditPage.copyInvitationLink();
  await teamEditPage.saveTeam();

  const secondUserInvitePage = new InvitationAcceptPage(secondUser.page);
  await secondUser.page.goto(regeneratedInvitationLink);
  await secondUserInvitePage.acceptInvitation();

  await expect(secondUser.page).toHaveURL(/\/.*\/board/);
});

test("can't accept invitation when user is already a team member", async ({
  secondUser,
}) => {
  const secondUserInvitePage = new InvitationAcceptPage(secondUser.page);
  await secondUser.page.goto(invitationLink);
  await secondUserInvitePage.acceptInvitation();

  await secondUser.page.goto(invitationLink);

  await secondUser.page
    .getByText("Jesteś już członkiem tego zespołu")
    .isVisible();
});

test("can't accept removed invitation", async ({ firstUser, secondUser }) => {
  const homePage = new HomePage(firstUser.page);
  await homePage.gotoEditTeam(teamName);
  const teamEditPage = new TeamEditPage(firstUser.page);
  await teamEditPage.removeInvitationLink();
  await teamEditPage.saveTeam();

  await secondUser.page.goto(invitationLink);

  await expect(secondUser.page).toHaveURL("/404");
});

test("can't accept regenerated invitation", async ({
  firstUser,
  secondUser,
}) => {
  const homePage = new HomePage(firstUser.page);
  await homePage.gotoEditTeam(teamName);
  const teamEditPage = new TeamEditPage(firstUser.page);
  await teamEditPage.regenerateInvitationLink();
  await teamEditPage.saveTeam();

  await secondUser.page.goto(invitationLink);

  await expect(secondUser.page).toHaveURL("/404");
});
