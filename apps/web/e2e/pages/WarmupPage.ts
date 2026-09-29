import type { Locator, Page } from "@playwright/test";

export class WarmupPage {
  readonly page: Page;
  readonly sidebarTitleLocator: Locator;
  readonly wheelLocator: Locator;
  readonly spinningLocator: Locator;
  readonly resultLocator: Locator;
  readonly startButtonLocator: Locator;
  readonly rerollButtonLocator: Locator;
  readonly openLinkButtonLocator: Locator;
  readonly roomFormLocator: Locator;
  readonly roomUrlInputLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebarTitleLocator = page.getByTestId("warmup-sidebar-title");
    this.wheelLocator = page.getByRole("img", {
      name: "Koło losujące rozgrzewkę",
    });
    this.spinningLocator = page.getByTestId("warmup-spinning");
    this.resultLocator = page.getByTestId("warmup-result");
    this.startButtonLocator = page.getByTestId("warmup-action-start");
    this.rerollButtonLocator = page.getByTestId("warmup-action-reroll");
    this.openLinkButtonLocator = page.getByTestId("warmup-action-open");
    this.roomFormLocator = page.getByTestId("warmup-room-form");
    this.roomUrlInputLocator = page.getByRole("textbox", {
      name: "Link do pokoju",
    });
  }

  async startDraw() {
    await this.startButtonLocator.click();
    await this.spinningLocator.waitFor({ state: "visible" });
  }

  async reroll() {
    await this.rerollButtonLocator.click();
    await this.spinningLocator.waitFor({ state: "visible" });
  }

  async waitForResult() {
    await this.resultLocator.waitFor({ state: "visible" });
  }

  async shareRoomLink(url: string) {
    await this.roomUrlInputLocator.fill(url);
    await this.roomFormLocator
      .getByRole("button", { name: "Udostępnij link" })
      .click();
  }
}
