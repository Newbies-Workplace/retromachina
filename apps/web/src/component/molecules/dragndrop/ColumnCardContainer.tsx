import type React from "react";
import { useDrop } from "react-dnd";
import { cn } from "../../../common/Util";
import { type CardDragPayload, ItemTypes } from "./dragndrop";

interface ColumnCardContainerProps {
  columnId: string;
  onCardDropped: (cardId: string, fromColumnId: string) => void;
}

export const ColumnCardContainer: React.FC<
  React.PropsWithChildren<ColumnCardContainerProps>
> = ({ children, columnId, onCardDropped }) => {
  const [{ isOverCurrent, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.CARD,
      drop: (item: CardDragPayload, monitor) => {
        if (!monitor.didDrop()) {
          onCardDropped(item.cardId, item.columnId);
        }
      },
      canDrop: (item: CardDragPayload) =>
        item.parentCardId !== null || item.columnId !== columnId,
      collect: (monitor) => ({
        isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [columnId],
  );

  return (
    <div
      ref={drop}
      className={cn(
        "flex flex-col gap-2 min-h-[500px] h-full pb-[70px] rounded-2xl",
        isOverCurrent && canDrop
          ? "border border-dashed"
          : "border border-transparent",
      )}
    >
      {children}
    </div>
  );
};
