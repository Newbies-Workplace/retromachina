import { expect, type Locator, type Page } from "@playwright/test";
import { RetroActivePage } from "./RetroActivePage";

export class DiscussPage extends RetroActivePage {
  readonly currentTopicLabel: Locator;
  readonly newActionPointInput: Locator;
  readonly actionPoints: Locator;
  readonly votedBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.currentTopicLabel = page.getByText("Aktualnie omawiany temat:");
    this.newActionPointInput = page.getByPlaceholder("Nowy action point...");
    this.votedBadge = page.getByText("zagłosowałeś/aś na ten temat");
    // Action points are the only cards with a delete button in this phase.
    this.actionPoints = page
      .getByTestId("card")
      .filter({ has: page.getByTestId("card-delete") });
  }

  /** Main area with the currently discussed topic (cards text + vote count). */
  currentTopic() {
    return this.page
      .locator("div.grow")
      .filter({ has: this.currentTopicLabel })
      .last();
  }

  /** "Już za chwilę..." sidebar listing remaining topics. */
  upcomingSidebar() {
    return this.page
      .locator('[data-sidebar="sidebar"]')
      .filter({ hasText: "Już za chwilę..." });
  }

  actionPointWithText(text: string) {
    return this.actionPoints.filter({ hasText: text });
  }

  async createActionPoint(text: string) {
    await this.newActionPointInput.fill(text);
    await this.newActionPointInput.press("Enter");
    await expect(this.actionPointWithText(text)).toBeVisible();
  }

  async editActionPoint(oldText: string, newText: string) {
    const ap = this.actionPointWithText(oldText);
    await ap.getByTestId("editable-text").click();
    const input = this.page.getByTestId("editable-text-input");
    await input.fill(newText);
    await input.press("Enter");
    await expect(this.actionPointWithText(newText)).toBeVisible();
  }

  async setOwner(text: string, ownerOption: string) {
    // Wait out layout animations that can briefly keep a stale duplicate card.
    await expect(this.actionPointWithText(text)).toHaveCount(1);
    await this.actionPointWithText(text).getByTestId("card-author").click();
    await this.page
      .getByTestId("user-picker-option")
      .filter({ hasText: ownerOption })
      .first()
      .click();
  }
}
