import { expect, type Locator, type Page } from "@playwright/test";

export class RetroArchivePage {
  readonly page: Page;
  readonly headerLocator: Locator;
  readonly currentRetroLocator: Locator;
  readonly finishedRetrosLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerLocator = page.getByTestId("archive-header");
    this.currentRetroLocator = page.getByTestId("current-retro");
    this.finishedRetrosLocator = page.getByTestId("retro");
  }

  /**
   * Opens the archive of `teamName` from the Home page. The archive view
   * bounces back to "/" when the user's teams are momentarily reloading, so
   * the navigation is retried until the archive header stays visible.
   */
  async gotoFromHome(teamName: string) {
    await this.page.goto("/");
    await expect(async () => {
      if (!this.page.url().endsWith("/archive")) {
        const card = this.page.getByTestId(`team-${teamName}`);
        await card.scrollIntoViewIfNeeded();
        await card.getByTestId("retro-archive").click({ timeout: 3000 });
      }
      await expect(this.headerLocator).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 20000 });
  }
}
