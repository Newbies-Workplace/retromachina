import type { Locator, Page } from "@playwright/test";

export const dragColumn = async ({
  page,
  source,
  target,
}: {
  page: Page;
  source: Locator;
  target: Locator;
}) => {
  const handle = source.getByTestId("column-drag-handle");
  const [handleBox, targetBox] = await Promise.all([
    handle.boundingBox(),
    target.boundingBox(),
  ]);

  if (!handleBox || !targetBox) {
    throw new Error("Column drag handle or target has no bounding box");
  }

  const sourceX = handleBox.x + handleBox.width / 2;
  const sourceY = handleBox.y + handleBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX + 10, sourceY, { steps: 5 });
  await page.mouse.move(targetX, targetY, { steps: 15 });
  await page.mouse.up();
};
