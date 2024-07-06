import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { InvitationAcceptPage } from "./pages/InvitationAcceptPage";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";

test.use({
  permissions: ["clipboard-write", "clipboard-read"],
});

test("can accept invitation", async ({ firstUser, secondUser }) => {
  const teamName = uuid();
  const teamCreatePage = new TeamCreatePage(firstUser.page);
  await teamCreatePage.goto();
  await teamCreatePage.fillTeamName(teamName);
  await teamCreatePage.generateInvitationLink();
  const invitationLink = await teamCreatePage.copyInvitationLink();
  await teamCreatePage.saveTeam();

  const secondUserInvitePage = new InvitationAcceptPage(secondUser.page);
  await secondUser.page.goto(invitationLink);
  await secondUserInvitePage.acceptInvitation();

  await expect(secondUser.page).toHaveURL(/\/.*\/board/);
});
