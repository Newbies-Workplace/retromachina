import { expect, type Locator, type Page } from "@playwright/test";

export class SettingsModal {
  readonly page: Page;
  readonly userMenuLocator: Locator;
  readonly settingsButtonLocator: Locator;
  readonly dialogLocator: Locator;
  readonly autoReadyAfterDrawLocator: Locator;
  readonly autoReadyAfterVotingLocator: Locator;
  readonly closeButtonLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenuLocator = page.locator(
      '[data-slot="avatar-group"]:has([data-slot="avatar"].cursor-pointer)',
    );
    this.settingsButtonLocator = page.getByText("Ustawienia", { exact: true });
    this.dialogLocator = page.getByRole("dialog", { name: "Ustawienia" });
    this.autoReadyAfterDrawLocator = this.dialogLocator
      .getByText("Automatyczna gotowość po wylosowaniu na maszynie losującej", {
        exact: true,
      })
      .locator("..")
      .getByRole("switch");
    this.autoReadyAfterVotingLocator = this.dialogLocator
      .getByText("Automatyczna gotowość po zagłosowaniu na tematy", {
        exact: true,
      })
      .locator("..")
      .getByRole("switch");
    this.closeButtonLocator = this.dialogLocator.getByRole("button", {
      name: "Zamknij",
      exact: true,
    });
  }

  async open() {
    if (await this.dialogLocator.isVisible()) return;
    if (!(await this.settingsButtonLocator.isVisible())) {
      await this.userMenuLocator.click();
    }
    await this.settingsButtonLocator.click();
    await expect(this.dialogLocator).toBeVisible();
  }

  async setAutoReadyAfterDraw(enabled: boolean) {
    if (
      (await this.autoReadyAfterDrawLocator.getAttribute("aria-checked")) !==
      String(enabled)
    ) {
      await this.autoReadyAfterDrawLocator.click();
    }
  }

  async setAutoReadyAfterVoting(enabled: boolean) {
    if (
      (await this.autoReadyAfterVotingLocator.getAttribute("aria-checked")) !==
      String(enabled)
    ) {
      await this.autoReadyAfterVotingLocator.click();
    }
  }

  async close() {
    await this.closeButtonLocator.click();
    await expect(this.dialogLocator).toBeHidden();
    // The preferences dialog leaves the user menu open underneath it.
    if (await this.settingsButtonLocator.isVisible()) {
      await this.userMenuLocator.click();
    }
  }
}
