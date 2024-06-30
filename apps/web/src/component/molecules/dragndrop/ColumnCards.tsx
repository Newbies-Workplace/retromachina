import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  DragLocationHistory,
  DropTargetRecord,
} from "@atlaskit/pragmatic-drag-and-drop/types";
import React, { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { cn } from "../../../common/Util";
import { CardMoveAction } from "../../../interfaces/CardMoveAction.interface";
import { isCard } from "./dragndrop";

interface ColumnCardContainerProps {
  columnId: string;
  onCardDropped?: (action: CardMoveAction) => void;
  children?: React.ReactNode;
}

export const ColumnCards: React.FC<ColumnCardContainerProps> = ({
  children,
  columnId,
  onCardDropped,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState<boolean>(false);

  const handleDraggedOverChange = (
    location: DragLocationHistory,
    self: DropTargetRecord,
  ) => {
    if (location.current.dropTargets[0]?.element !== self.element) {
      setIsDraggedOver(false);
    } else {
      setIsDraggedOver(true);
    }
  };

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    return combine(
      dropTargetForElements({
        element: element,
        canDrop: ({ source }) => {
          const data = source.data;
          if (!isCard(data)) {
            return false;
          }

          const isSameColumn = data.columnId === columnId;
          const isFromGroup = data.parentCardId !== null;
          const isGroupParent = data.parentCardId === data.cardId;

          if (isFromGroup && !isGroupParent) {
            return true;
          }

          return !isSameColumn && !isGroupParent;
        },
        onDropTargetChange: ({ location, self }) => {
          handleDraggedOverChange(location, self);
        },
        onDragStart: ({ location, self }) => {
          handleDraggedOverChange(location, self);
        },
        onDrop: ({ source, location, self }) => {
          const data = source.data;
          if (!isCard(data)) {
            return;
          }

          // do nothing if nested drop target is not the container itself
          if (location.current.dropTargets[0]?.element !== self.element) {
            setIsDraggedOver(false);
            return;
          }

          onCardDropped?.({
            targetType: "column",
            cardId: data.cardId,
            targetId: columnId,
          });
          setIsDraggedOver(false);
        },
      }),
    );
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 pb-[70px] rounded-2xl min-h-[500px] h-full",
        isDraggedOver && "ring-2 ring-primary-500",
      )}
    >
      {children}
    </div>
  );
};
