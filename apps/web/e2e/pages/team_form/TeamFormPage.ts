import { expect, Locator } from "@playwright/test";
import { Page } from "playwright-core";

export class TeamFormPage {
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

    this.roleSelectorLocator = this.page.getByTestId("member-role-select");
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

  async regenerateInvitationLink() {
    await this.regenerateInvitationLinkLocator.click();

    await this.page.getByTestId("confirm-dialog-yes").click();
  }

  async copyInvitationLink(): Promise<string> {
    await this.page.getByRole("button", { name: "Skopiuj" }).click();

    return this.page.evaluate("navigator.clipboard.readText()");
  }

  async removeInvitationLink() {
    await this.removeInvitationLinkLocator.click();

    await this.page.getByTestId("confirm-dialog-yes").click();
  }

  /**
   * Waits until the team's members are rendered. The page is occasionally stuck
   * on its loading state after client-side navigation, so reload before failing.
   */
  async waitForMembers() {
    await expect(async () => {
      try {
        await expect(
          this.page.getByTestId("team-member-row").first(),
        ).toBeVisible({ timeout: 5_000 });
      } catch (e) {
        await this.page.reload();
        throw e;
      }
    }).toPass({ timeout: 25_000 });
  }

  memberRow(email: string) {
    return this.page.locator(
      `[data-testid="team-member-row"][data-email="${email}"]`,
    );
  }

  async addMember(email: string) {
    await this.newEmailLocator.fill(email);
    await this.newEmailLocator.press("Enter");
  }

  async changeMemberRole(email: string, roleLabel: string) {
    await this.memberRow(email).getByTestId("member-role-select").click();
    await this.page.getByRole("option", { name: roleLabel }).click();
  }

  async removeMember(email: string) {
    await this.memberRow(email).getByTestId("remove-user").click();
  }

  async saveTeam() {
    await this.saveButtonLocator.click();
  }
}
