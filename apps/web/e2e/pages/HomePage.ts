import { Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/");
  }

  async gotoEditTeam(teamName: string) {
    await this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${teamName}$`) })
      .getByTestId("edit-team")
      .click();
  }

  async gotoTaskList(teamName: string) {
    await this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${teamName}$`) })
      .getByTestId("task-list")
      .click();
  }

  async createRetro(teamName: string) {
    await this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${teamName}$`) })
      .getByTestId("create-retro")
      .click();
  }

  async joinRetro(teamName: string) {
    await this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${teamName}$`) })
      .getByTestId("current-retro")
      .click();
  }
}
