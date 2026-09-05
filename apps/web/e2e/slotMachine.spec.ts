import { v4 as uuid } from "uuid";
import { expect, test } from "../playwright/fixtures";
import { HomePage } from "./pages/HomePage";
import { RetroActivePage } from "./pages/RetroActivePage";
import { RetroCreatePage } from "./pages/RetroCreatePage";
import { SettingsModal } from "./pages/SettingsModal";
import { TeamCreatePage } from "./pages/team_form/TeamCreatePage";

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
