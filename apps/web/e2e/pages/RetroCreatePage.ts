import { Locator, Page } from "@playwright/test";

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
    const names = await this.page
      .getByTestId("column-name")
      .all()
      .then((els) => Promise.all(els.map((el) => el.inputValue())));

    return names.map((name, i) => ({
      name,
    }));
  }

  async createRetro() {
    await this.page.getByTestId("create-retro").click();
  }
}
