import cs from "classnames";
import type React from "react";
import { useDrop } from "react-dnd";
import { useKeyDownListener } from "../../../../context/useKeyDownListener";
import { type CardDragPayload, ItemTypes } from "../dragndrop";
import styles from "./GroupCardContainer.module.scss";

interface GroupCardContainerProps {
  parentCardId: string;
  onCardDropped: (cardId: string, fromColumnId: string) => void;
}

export const GroupCardContainer: React.FC<
  React.PropsWithChildren<GroupCardContainerProps>
> = ({ children, parentCardId, onCardDropped }) => {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.CARD,
      drop: (item: CardDragPayload) => {
        onCardDropped(item.cardId, item.columnId);
      },
      canDrop: (item: CardDragPayload) =>
        item.cardId !== parentCardId && item.parentCardId !== parentCardId,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [parentCardId],
  );

  const isShiftPressed = useKeyDownListener("Shift");

  return (
    <div
      ref={drop}
      className={cs(styles.group, {
        [styles.shifted]: isShiftPressed,
      })}
    >
      {children}
    </div>
  );
};
