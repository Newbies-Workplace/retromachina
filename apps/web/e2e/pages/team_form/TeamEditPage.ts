import { Locator, Page } from "@playwright/test";
import { TeamForm } from "./TeamForm";

export class TeamEditPage extends TeamForm {
  readonly removeTeamLocator: Locator;

  constructor(page: Page) {
    super(page);

    this.removeTeamLocator = this.page.getByTestId("remove-team");
  }

  async removeTeam() {
    await this.removeTeamLocator.click();

    await this.page.getByRole("button", { name: "Tak" }).click();
  }
}
