import { Locator } from "@playwright/test";
import { Page } from "playwright-core";

export class TeamForm {
  readonly page: Page;

  readonly teamNameLocator: Locator;

  readonly invitationLinkLocator: Locator;
  readonly generateInvitationLinkLocator: Locator;
  readonly regenerateInvitationLinkLocator: Locator;
  readonly copyInvitationLinkLocator: Locator;
  readonly removeInvitationLinkLocator: Locator;

  readonly roleSelectorLocator: Locator;
  readonly userRemoveLocator: Locator;

  readonly newEmailLocator: Locator;
  readonly saveButtonLocator: Locator;

  constructor(page: Page) {
    this.page = page;

    this.teamNameLocator = this.page.getByTestId("team-name");
    this.invitationLinkLocator = this.page.getByTestId("invitation-link");
    this.generateInvitationLinkLocator = this.page.getByTestId(
      "generate-invitation-link",
    );
    this.regenerateInvitationLinkLocator = this.page.getByTestId(
      "regenerate-invitation-link",
    );
    this.copyInvitationLinkLocator = this.page.getByTestId(
      "copy-invitation-link",
    );
    this.removeInvitationLinkLocator = this.page.getByTestId(
      "remove-invitation-link",
    );

    this.roleSelectorLocator = this.page.getByTestId("role-selector");
    this.userRemoveLocator = this.page.getByTestId("remove-user");

    this.newEmailLocator = this.page.getByTestId("new-user-email");
    this.saveButtonLocator = this.page.getByTestId("save-team");
  }

  async fillTeamName(teamName: string) {
    await this.teamNameLocator.click();
    await this.teamNameLocator.fill(teamName);
  }

  async fillTeamUsers(users: { email: string }[]) {
    for (const user of users) {
      await this.newEmailLocator.click();
      await this.newEmailLocator.fill(user.email);
    }
  }

  async generateInvitationLink() {
    await this.page.getByRole("button", { name: "Wygeneruj" }).click();
  }

  async copyInvitationLink(): Promise<string> {
    await this.page.getByRole("button", { name: "Skopiuj" }).click();

    return this.page.evaluate("navigator.clipboard.readText()");
  }

  async saveTeam() {
    await this.saveButtonLocator.click();
  }
}
