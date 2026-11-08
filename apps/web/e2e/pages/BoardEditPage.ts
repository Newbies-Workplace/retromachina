import { expect, type Locator, type Page } from "@playwright/test";

export class BoardEditPage {
  readonly page: Page;
  readonly columns: Locator;
  readonly addColumnButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.columns = page.getByTestId("column-create");
    this.addColumnButton = page.getByRole("button", { name: "Nowa Kolumna" });
    this.saveButton = page.getByRole("button", { name: "Zapisz tablicę" });
  }

  async goto(teamId: string) {
    await this.page.goto(`/team/${teamId}/board/edit`);
    await expect(this.page.getByText("Edycja tablicy")).toBeVisible();
    await expect(this.columns.first()).toBeVisible({ timeout: 15_000 });
  }

  columnNames() {
    return this.columns.getByTestId("column-name");
  }

  async addColumn(name: string) {
    const count = await this.columns.count();
    await this.addColumnButton.click();
    await expect(this.columns).toHaveCount(count + 1);
    await this.columnNames().nth(count).fill(name);
  }

  async renameColumn(index: number, name: string) {
    await this.columnNames().nth(index).fill(name);
  }

  async removeColumn(index: number) {
    await this.columns.nth(index).getByTestId("remove-column").click();
  }

  async save() {
    await this.saveButton.click();
  }
}
