export type TColumn = {
  id: string;
  name: string;
  desc: string | null;
};

const columnKey = Symbol("column");
export type TColumnData = {
  [columnKey]: true;
  column: TColumn;
  rect: DOMRect;
};

export function getColumnData({
  column,
  rect,
}: Omit<TColumnData, typeof columnKey>): TColumnData {
  return {
    [columnKey]: true,
    column,
    rect,
  };
}

export function isColumnData(
  value: Record<string | symbol, unknown>,
): value is TColumnData {
  return Boolean(value[columnKey]);
}

export function isDraggingAColumn({
  source,
}: {
  source: { data: Record<string | symbol, unknown> };
}): boolean {
  return isColumnData(source.data);
}
