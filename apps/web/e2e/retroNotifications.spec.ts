import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { InvitationAcceptPage } from "./pages/InvitationAcceptPage";
import { RetroCreatePage } from "./pages/RetroCreatePage";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";

test.use({
  permissions: ["clipboard-write", "clipboard-read"],
});

test("another team member is notified when a retrospective starts", async ({
  firstUser,
  secondUser,
}) => {
  const teamName = `Notifications ${uuid()}`;
  const teamCreatePage = new TeamCreatePage(firstUser.page);
  await teamCreatePage.goto();
  await teamCreatePage.fillTeamName(teamName);
  await teamCreatePage.generateInvitationLink();
  const invitationLink = await teamCreatePage.copyInvitationLink();
  await teamCreatePage.saveTeam();

  await secondUser.page.goto(invitationLink);
  await new InvitationAcceptPage(secondUser.page).acceptInvitation();
  await expect(secondUser.page).toHaveURL(/\/.*\/board/);

  const notificationStream = secondUser.page.waitForResponse(
    (response) =>
      response.url().endsWith("/notifications/events") &&
      response.status() === 200,
  );
  await new HomePage(secondUser.page).goto();
  await notificationStream;

  await new HomePage(firstUser.page).gotoCreateRetro(teamName);
  await new RetroCreatePage(firstUser.page).createRetro();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);
  const retroId = firstUser.page.url().match(/\/retro\/([^/]+)/)?.[1];
  expect(retroId).toBeTruthy();

  await expect(
    secondUser.page.getByText(`Rozpoczęto retrospektywę zespołu ${teamName}`),
  ).toBeVisible();
  await secondUser.page.getByRole("button", { name: "Dołącz" }).click();
  await expect(secondUser.page).toHaveURL(`/retro/${retroId}/reflection`);
});
