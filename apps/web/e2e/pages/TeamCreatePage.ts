import { Page } from "playwright-core";

export class TeamCreatePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/team/create");
  }

  async createTeam(teamName: string, users: { email: string }[]) {
    await this.page.getByPlaceholder("Nazwa zespołu").click();
    await this.page.getByPlaceholder("Nazwa zespołu").fill(teamName);

    for (const user of users) {
      await this.page.getByPlaceholder("Podaj adres email...").click();
      await this.page.getByPlaceholder("Podaj adres email...").fill(user.email);
    }

    await this.page.getByRole("button", { name: "Zapisz" }).click();
  }
}
