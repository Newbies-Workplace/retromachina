import { Page } from "playwright-core";

export class InvitationAcceptPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async acceptInvitation() {
    await this.page.getByTestId("join-team-button").click();
  }
}
