import { expect, type Locator, type Page } from "@playwright/test";
import { dragTo } from "../helpers/dragTo";

export class BoardPage {
  readonly page: Page;
  readonly columns: Locator;
  readonly cards: Locator;
  readonly onlyMineSwitch: Locator;
  readonly editBoardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.columns = page.getByTestId("column");
    this.cards = page.getByTestId("card");
    this.onlyMineSwitch = page.getByTestId("only-mine-switch");
    this.editBoardButton = page.getByTestId("edit-board");
  }

  async goto(teamId: string) {
    await this.page.goto(`/team/${teamId}/board`);
    await expect(this.columns.first()).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Waits for the board to render. The board is occasionally stuck on its
   * loading state right after navigation, so reload once before failing.
   */
  async waitForLoaded() {
    await expect(async () => {
      try {
        await expect(this.columns.first()).toBeVisible({ timeout: 5_000 });
      } catch (e) {
        await this.page.reload();
        throw e;
      }
    }).toPass({ timeout: 25_000 });
  }

  teamId(): string {
    const id = this.page.url().match(/\/team\/([^/]+)\/board/)?.[1];
    if (!id) throw new Error(`Cannot read team id from ${this.page.url()}`);
    return id;
  }

  column(index: number) {
    return this.columns.nth(index);
  }

  card(text: string) {
    return this.cards.filter({ hasText: text });
  }

  async addTask(columnIndex: number, text: string) {
    await this.column(columnIndex).getByTestId("board-add-task").click();
    const input = this.page.getByTestId("editable-text-input");
    await expect(input).toBeFocused();
    await input.fill(text);
    await input.press("Enter");
  }

  async editTask(oldText: string, newText: string) {
    await this.card(oldText).getByTestId("editable-text").click();
    const input = this.page.getByTestId("editable-text-input");
    await input.fill(newText);
    await input.press("Enter");
  }

  async deleteTask(text: string) {
    await this.card(text).getByTestId("card-delete").click();
  }

  async setOwner(text: string, ownerLabel: string) {
    await this.card(text).getByTestId("card-author").click();
    await this.page
      .getByTestId("user-picker-option")
      .filter({ hasText: ownerLabel })
      .click();
  }

  /**
   * Drags a task into another column. Cards animate after updates, so the
   * drag is retried until the task shows up in the target column.
   */
  async moveTask(text: string, columnIndex: number) {
    await expect(async () => {
      await expect(this.card(text)).toHaveCount(1, { timeout: 2_000 });
      await dragTo({
        page: this.page,
        source: this.card(text),
        target: this.column(columnIndex),
        targetPosition: "center",
      });
      await expect(this.column(columnIndex).getByText(text)).toBeVisible({
        timeout: 2_000,
      });
    }).toPass({ timeout: 15_000 });
  }
}
