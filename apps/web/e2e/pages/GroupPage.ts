import { expect, type Locator, type Page } from "@playwright/test";
import { dragTo } from "../helpers/dragTo";
import { RetroActivePage } from "./RetroActivePage";

export class GroupPage extends RetroActivePage {
  constructor(page: Page) {
    super(page);
  }

  card(text: string): Locator {
    return this.cardWithText(text);
  }

  /** The group container holding all of the given cards. */
  groupContaining(...texts: string[]): Locator {
    let group = this.page.locator("div.flex.flex-col.min-w-25");
    for (const text of texts) {
      group = group.filter({ has: this.card(text) });
    }
    return group;
  }

  /** Merges `source` into the group of `target` (drop on its middle). */
  async mergeCard(source: string, target: string) {
    await expect(this.card(source)).toBeVisible();
    await expect(this.card(target)).toBeVisible();
    await dragTo({
      page: this.page,
      source: this.card(source),
      target: this.card(target),
      targetPosition: "center",
    });
  }

  /**
   * Drops `source` on an empty area of column `columnIndex`, below its
   * cards but still inside the viewport (the column itself can be taller).
   */
  async dropInColumn(source: string, columnIndex: number) {
    await expect(this.card(source)).toBeVisible();
    const column = this.anyColumnLocator.nth(columnIndex);
    const dropZone = column.locator("> div").last();
    const [from, zone] = await Promise.all([
      this.card(source).boundingBox(),
      dropZone.boundingBox(),
    ]);
    if (!from || !zone) throw new Error("Missing bounding box");

    let bottom = zone.y;
    for (const card of await column.getByTestId("card").all()) {
      const box = await card.boundingBox();
      if (box) bottom = Math.max(bottom, box.y + box.height);
    }
    const x = zone.x + zone.width / 2;
    const y = bottom + 60;
    const fromX = from.x + from.width / 2;
    // Grab near the top edge: child cards of a group overlap the parent below
    const fromY = from.y + 10;

    await this.page.mouse.move(fromX, fromY);
    await this.page.mouse.down();
    await this.page.mouse.move(fromX + 10, fromY, { steps: 5 });
    await this.page.mouse.move(x, y, { steps: 15 });
    await this.page.mouse.up();
  }
}
