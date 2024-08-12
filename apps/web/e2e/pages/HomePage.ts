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
    await this.page.getByTestId(`team-${teamName}`).scrollIntoViewIfNeeded();
    await this.page
      .getByTestId(`team-${teamName}`)
      .getByTestId("edit-team")
      .click();
  }

  async gotoTaskList(teamName: string) {
    await this.page.getByTestId(`team-${teamName}`).scrollIntoViewIfNeeded();
    await this.page
      .getByTestId(`team-${teamName}`)
      .getByTestId("task-list")
      .click();
  }

  async gotoCreateRetro(teamName: string) {
    await this.page.getByTestId(`team-${teamName}`).scrollIntoViewIfNeeded();
    await this.page
      .getByTestId(`team-${teamName}`)
      .getByTestId("create-retro")
      .click();
  }

  async gotoCurrentRetro(teamName: string) {
    await this.page.getByTestId(`team-${teamName}`).scrollIntoViewIfNeeded();
    await this.page
      .getByTestId(`team-${teamName}`)
      .getByTestId("current-retro")
      .click();
  }
}
