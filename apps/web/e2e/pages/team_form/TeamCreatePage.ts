import { TeamForm } from "./TeamForm";

export class TeamCreatePage extends TeamForm {
  async goto() {
    await this.page.goto("/team/create");
  }
}
