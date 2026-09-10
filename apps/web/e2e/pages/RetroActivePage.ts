import { expect, type Locator, type Page } from "@playwright/test";
import { dragColumn } from "../helpers/dragColumn";

export class RetroActivePage {
  readonly page: Page;
  readonly cardInputsLocator: Locator;
  readonly readyProgressLocator: Locator;
  readonly nextStageButtonLocator: Locator;
  readonly readyButtonLocator: Locator;
  readonly slotMachineToggleLocator: Locator;
  readonly slotMachineTitleLocator: Locator;
  readonly slotMachineLeverLocator: Locator;
  readonly columnsLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cardInputsLocator = page.getByTestId("card-input");
    this.readyProgressLocator = page.getByRole("progressbar");
    // Icon-only toolbar controls currently have no accessible names.
    const toolbar = this.readyProgressLocator.locator("..").locator("..");
    this.nextStageButtonLocator = toolbar.getByRole("button").filter({
      has: page.locator(".lucide-arrow-right"),
    });
    this.readyButtonLocator = toolbar.getByRole("button").filter({
      has: page.locator(".lucide-check"),
    });
    // In the grouping stage, the slot machine toggle is the first control.
    this.slotMachineToggleLocator = toolbar.getByRole("button").first();
    this.slotMachineTitleLocator = page.getByText("Losowanko", { exact: true });
    this.slotMachineLeverLocator = page.locator(".lever");
    this.columnsLocator = page.getByTestId("retro-column");
  }

  async createCard(text: string, columnIndex = 0) {
    const input = this.cardInputsLocator.nth(columnIndex);
    await input.fill(text);
    await input.press("Enter");
    await expect(this.page.getByText(text, { exact: true })).toBeVisible();
  }

  async nextStage() {
    await this.nextStageButtonLocator.click();
  }

  async getColumnTitles() {
    return this.page.getByTestId("column-title").allTextContents();
  }

  async editColumnTitle(columnIndex: number, title: string) {
    const column = this.columnsLocator.nth(columnIndex);
    await column.getByTestId("column-title").click();
    const input = column.getByTestId("column-title-input");
    await input.fill(title);
    await input.press("Enter");
    await expect(column.getByTestId("column-title")).toHaveText(title);
  }

  async editColumnDescription(columnIndex: number, description: string) {
    const column = this.columnsLocator.nth(columnIndex);
    await column.getByTestId("column-description").click();
    const input = column.getByTestId("column-description-input");
    await input.fill(description);
    await input.press("Enter");
    await expect(column.getByTestId("column-description")).toHaveText(
      description || "Dodaj opis",
    );
  }

  async reorderColumn(fromIndex: number, toIndex: number) {
    await dragColumn({
      page: this.page,
      source: this.columnsLocator.nth(fromIndex),
      target: this.columnsLocator.nth(toIndex),
    });
  }

  async toggleReady() {
    await this.readyButtonLocator.click();
  }

  async showSlotMachine() {
    if (!(await this.slotMachineTitleLocator.isVisible())) {
      await this.slotMachineToggleLocator.click();
    }
    await expect(this.slotMachineTitleLocator).toBeVisible();
  }

  async hideSlotMachine() {
    if (await this.slotMachineTitleLocator.isVisible()) {
      await this.slotMachineToggleLocator.click();
    }
    await expect(this.slotMachineTitleLocator).toBeHidden();
  }

  async drawSlotMachine() {
    await expect(this.slotMachineLeverLocator).toBeVisible();
    const bounds = await this.slotMachineLeverLocator.boundingBox();
    if (!bounds) throw new Error("Slot machine lever has no bounding box");
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;

    await this.pullLever(x, y);
  }

  private async pullLever(x: number, y: number) {
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y + 45, { steps: 10 });
    await this.page.mouse.up();
  }
}
