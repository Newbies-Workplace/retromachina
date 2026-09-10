import { Locator, Page } from "@playwright/test";
import { dragColumn } from "../helpers/dragColumn";

export class RetroCreatePage {
  readonly page: Page;
  readonly randomizeTemplateButtonLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.randomizeTemplateButtonLocator =
      this.page.getByTestId("randomize-template");
  }

  async randomizeTemplate() {
    await this.randomizeTemplateButtonLocator.click();
  }

  async getColumns() {
    const columns = await this.page.getByTestId("column-create").all();
    return Promise.all(
      columns.map(async (column) => ({
        name: await column.getByTestId("column-name").inputValue(),
        description: await column
          .getByTestId("column-description")
          .inputValue(),
      })),
    );
  }

  async clearTemplate() {
    await this.page.getByTestId("clear-template").click();
  }

  async addColumn(name: string, description = "") {
    await this.page.getByRole("button", { name: "Nowa kolumna" }).click();
    const column = this.page.getByTestId("column-create").last();
    await column.getByTestId("column-name").fill(name);
    await column.getByTestId("column-description").fill(description);
  }

  async replaceColumns(columns: Array<{ name: string; description?: string }>) {
    await this.clearTemplate();
    for (const column of columns) {
      await this.addColumn(column.name, column.description);
    }
  }

  async reorderColumn(fromIndex: number, toIndex: number) {
    const columns = this.page.getByTestId("column-create");
    await dragColumn({
      page: this.page,
      source: columns.nth(fromIndex),
      target: columns.nth(toIndex),
    });
  }

  async createRetro() {
    await this.page.getByTestId("create-retro-confirm").click();
  }
}
