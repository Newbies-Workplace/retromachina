import { expect, type Locator, type Page } from "@playwright/test";
import { RetroActivePage } from "./RetroActivePage";

export class VotePage extends RetroActivePage {
  readonly voteLimitLocator: Locator;
  readonly voteLimitValueLocator: Locator;

  constructor(page: Page) {
    super(page);
    this.voteLimitLocator = page.getByTestId("vote-limit");
    this.voteLimitValueLocator = page.getByTestId("vote-limit-value");
  }

  /** Waits for the current phase to render its cards before navigating. */
  override async gotoStage(stage: "group" | "vote" | "discuss") {
    await expect(this.cardsLocator.first()).toBeVisible();
    await super.gotoStage(stage);
  }

  addButton(text: string) {
    return this.cardWithText(text).getByTestId("vote-add");
  }

  removeButton(text: string) {
    return this.cardWithText(text).getByTestId("vote-remove");
  }

  voteCount(text: string) {
    return this.cardWithText(text).getByTestId("vote-count");
  }

  async addVote(text: string, expectedCount: number) {
    await this.addButton(text).click();
    await expect(this.voteCount(text)).toHaveText(String(expectedCount));
  }

  async removeVote(text: string, expectedCount: number) {
    await this.removeButton(text).click();
    await expect(this.voteCount(text)).toHaveText(String(expectedCount));
  }

  async openVoteLimit() {
    if (!(await this.voteLimitValueLocator.isVisible())) {
      await this.voteLimitLocator.click();
    }
    await expect(this.voteLimitValueLocator).toBeVisible();
  }

  async setVoteLimit(limit: number) {
    await this.openVoteLimit();
    const current = Number(await this.voteLimitValueLocator.textContent());
    const step = limit > current ? 1 : -1;
    const button = this.page.getByTestId(
      step > 0 ? "vote-limit-increase" : "vote-limit-decrease",
    );
    for (let value = current; value !== limit; value += step) {
      await button.click();
      await expect(this.voteLimitValueLocator).toHaveText(String(value + step));
    }
  }
}
