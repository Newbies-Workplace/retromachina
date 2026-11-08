import type { Locator, Page } from "@playwright/test";

type Position = "center" | "top" | "bottom";

/**
 * Drags `source` onto `target` with real mouse events, which
 * pragmatic-drag-and-drop needs (Playwright's `dragTo` is not enough for the
 * column handles). `targetPosition` picks where inside the target to drop:
 * e.g. "bottom" to hit an empty area under the cards of a column.
 */
export const dragTo = async ({
  page,
  source,
  target,
  targetPosition = "center",
}: {
  page: Page;
  source: Locator;
  target: Locator;
  targetPosition?: Position;
}) => {
  const [sourceBox, targetBox] = await Promise.all([
    source.boundingBox(),
    target.boundingBox(),
  ]);

  if (!sourceBox || !targetBox) {
    throw new Error("Drag source or target has no bounding box");
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY =
    targetPosition === "top"
      ? targetBox.y + 10
      : targetPosition === "bottom"
        ? targetBox.y + targetBox.height - 10
        : targetBox.y + targetBox.height / 2;

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX + 10, sourceY, { steps: 5 });
  await page.mouse.move(targetX, targetY, { steps: 15 });
  await page.mouse.up();
};
