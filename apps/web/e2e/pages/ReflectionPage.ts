import { expect, type Locator, type Page } from "@playwright/test";
import { RetroActivePage } from "./RetroActivePage";

export class ReflectionPage extends RetroActivePage {
  constructor(page: Page) {
    super(page);
  }

  column(index: number): Locator {
    return this.columnsLocator.nth(index);
  }

  cardInput(columnIndex = 0): Locator {
    return this.column(columnIndex).getByTestId("card-input");
  }

  /** Pulsing box under the card input, visible while someone is typing. */
  typingIndicator(columnIndex = 0): Locator {
    return this.column(columnIndex).locator(".animate-pulse");
  }

  /** Team card counter, e.g. "2 kartki zespołu". */
  teamCounter(columnIndex = 0): Locator {
    return this.column(columnIndex).getByText(/zespołu$/);
  }

  async typeCardText(text: string, columnIndex = 0) {
    await this.cardInput(columnIndex).fill(text);
  }

  async submitCard(text: string, columnIndex = 0) {
    const input = this.cardInput(columnIndex);
    await input.fill(text);
    await input.press("Enter");
  }

  async editCard(oldText: string, newText: string) {
    const card = this.cardWithText(oldText);
    await card.getByTestId("editable-text").click();
    // The textarea content changes while typing, so do not re-filter by text
    const input = this.page.getByTestId("editable-text-input");
    await input.fill(newText);
    await input.press("Enter");
  }

  async deleteCard(text: string) {
    await this.cardWithText(text).getByTestId("card-delete").click();
  }

  async expectReadyPercentage(value: number) {
    await expect(this.readyProgressLocator).toHaveAttribute(
      "aria-valuenow",
      String(value),
    );
  }
}
