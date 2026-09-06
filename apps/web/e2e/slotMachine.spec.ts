import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { InvitationAcceptPage } from "./pages/InvitationAcceptPage";
import { RetroActivePage } from "./pages/RetroActivePage";
import { RetroCreatePage } from "./pages/RetroCreatePage";
import { SettingsModal } from "./pages/SettingsModal";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";

test.use({
  permissions: ["clipboard-write", "clipboard-read"],
});

for (const autoReady of [true, false]) {
  test(
    autoReady
      ? "slot machine marks the drawn user ready by default"
      : "slot machine leaves the drawn user unready when auto-ready is disabled",
    async ({ firstUser }) => {
      const { page } = firstUser;
      // Clear inherited preferences so the enabled case exercises the default.
      await page.addInitScript(() => {
        localStorage.removeItem("preferences-store");
      });

      const teamName = uuid();
      const teamCreatePage = new TeamCreatePage(page);
      await teamCreatePage.goto();
      await teamCreatePage.fillTeamName(teamName);
      await teamCreatePage.saveTeam();
      await expect(page).toHaveURL("/");
      await new HomePage(page).gotoCreateRetro(teamName);

      await new RetroCreatePage(page).createRetro();
      await expect(page).toHaveURL(/\/retro\/.+\/reflection/);

      const settings = new SettingsModal(page);
      await settings.open();
      await expect(settings.autoReadyAfterDrawLocator).toBeChecked();
      if (!autoReady) {
        await settings.setAutoReadyAfterDraw(false);
        await expect(settings.autoReadyAfterDrawLocator).not.toBeChecked();
      }
      await settings.close();

      const retro = new RetroActivePage(page);
      // Only this user has a card, making the server's random draw deterministic.
      await retro.createCard(`Slot machine regression ${uuid()}`);
      await retro.nextStage();
      await expect(page).toHaveURL(/\/retro\/.+\/group/);
      await expect(retro.readyProgressLocator).toHaveAttribute(
        "aria-valuenow",
        "0",
      );
      await retro.showSlotMachine();
      await retro.drawSlotMachine();

      if (autoReady) {
        await expect(retro.readyProgressLocator).toHaveAttribute(
          "aria-valuenow",
          "100",
          {
            timeout: 10_000,
          },
        );
      } else {
        // Observe beyond the 2.4-second auto-ready delay to avoid a false pass.
        await page.waitForTimeout(3500);
        await expect(retro.readyProgressLocator).toHaveAttribute(
          "aria-valuenow",
          "0",
        );
      }
    },
  );
}

test("slot machine marks only the drawn user ready when two users are present", async ({
  firstUser,
  secondUser,
}) => {
  const teamName = uuid();
  const teamCreatePage = new TeamCreatePage(firstUser.page);
  await teamCreatePage.goto();
  await teamCreatePage.fillTeamName(teamName);
  await teamCreatePage.generateInvitationLink();
  const invitationLink = await teamCreatePage.copyInvitationLink();
  await teamCreatePage.saveTeam();

  const invitationAcceptPage = new InvitationAcceptPage(secondUser.page);
  await secondUser.page.goto(invitationLink);
  await invitationAcceptPage.acceptInvitation();
  await expect(secondUser.page).toHaveURL(/\/.*\/board/);

  await new HomePage(firstUser.page).gotoCreateRetro(teamName);
  await new RetroCreatePage(firstUser.page).createRetro();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/reflection/);

  await new HomePage(secondUser.page).goto();
  await new HomePage(secondUser.page).gotoCurrentRetro(teamName);
  await expect(secondUser.page).toHaveURL(/\/retro\/.+\/reflection/);

  const firstUserRetro = new RetroActivePage(firstUser.page);
  const secondUserRetro = new RetroActivePage(secondUser.page);
  // A card from only the first user makes the draw deterministic.
  await firstUserRetro.createCard(`Two-user slot machine ${uuid()}`);
  await firstUserRetro.nextStage();
  await expect(firstUser.page).toHaveURL(/\/retro\/.+\/group/);
  await expect(secondUser.page).toHaveURL(/\/retro\/.+\/group/);

  await firstUserRetro.showSlotMachine();
  await firstUserRetro.drawSlotMachine();

  await expect(firstUserRetro.readyProgressLocator).toHaveAttribute(
    "aria-valuenow",
    "50",
    { timeout: 10_000 },
  );
  await expect(secondUserRetro.readyProgressLocator).toHaveAttribute(
    "aria-valuenow",
    "50",
  );
});
