import { TeamFormPage } from "./TeamFormPage";

export class TeamCreatePage extends TeamFormPage {
  async goto() {
    await this.page.goto("/team/create");
  }
}
