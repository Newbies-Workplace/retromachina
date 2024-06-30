import {
  Instruction,
  attachInstruction,
  extractInstruction,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { cn } from "../../../common/Util";
import { useKeyDownListener } from "../../../context/useKeyDownListener";
import { CardMoveAction } from "../../../interfaces/CardMoveAction.interface";
import { isCard } from "./dragndrop";

interface GroupCardContainerProps {
  className?: string;
  parentCardId: string;
  columnId: string;
  onCardDropped?: (action: CardMoveAction) => void;
  children?: React.ReactNode;
}

export const CardGroup: React.FC<GroupCardContainerProps> = ({
  className,
  children,
  parentCardId,
  onCardDropped,
  columnId,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [groupDragged, setGroupDragged] = useState<boolean>(false);
  const [closestEdge, setClosestEdge] = useState<
    "top" | "mid" | "bottom" | null
  >(null);

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    return combine(
      dropTargetForElements({
        element: element,
        getData: ({ input, element, source }) => {
          const data = source.data;
          if (!isCard(data)) {
            return {};
          }

          const isSameColumn = data.columnId === columnId;

          return attachInstruction(
            {},
            {
              input,
              element,
              currentLevel: 0,
              indentPerLevel: 20,
              mode: "standard",
              // If the card is in the same column, it cannot be reordered above or below
              block: isSameColumn ? ["reorder-above", "reorder-below"] : [],
            },
          );
        },
        canDrop: ({ source }) => {
          const data = source.data;
          if (!isCard(data)) {
            return false;
          }

          const isSameGroup = data.parentCardId === parentCardId;
          const isDroppingOntoItself = data.cardId === parentCardId;

          return !isSameGroup && !isDroppingOntoItself;
        },
        onDrag: (args) => {
          const instruction: Instruction | null = extractInstruction(
            args.self.data,
          );
          setClosestEdge(
            instruction?.type === "reorder-above"
              ? "top"
              : instruction?.type === "reorder-below"
                ? "bottom"
                : instruction?.type === "make-child"
                  ? "mid"
                  : null,
          );
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: (args) => {
          const data = args.source.data;
          if (!isCard(data)) {
            return;
          }

          setClosestEdge(null);
          const instruction: Instruction | null = extractInstruction(
            args.self.data,
          );

          if (
            instruction?.type === "reorder-above" ||
            instruction?.type === "reorder-below"
          ) {
            onCardDropped?.({
              targetType: "column",
              cardId: data.cardId,
              targetId: columnId,
            });
          } else if (instruction?.type === "make-child") {
            onCardDropped?.({
              targetType: "card",
              cardId: data.cardId,
              targetId: parentCardId,
            });
          }
        },
      }),
      monitorForElements({
        onDragStart: ({ source }) => {
          const data = source.data;
          if (!isCard(data)) {
            return false;
          }

          if (data.cardId === parentCardId) {
            setGroupDragged(true);
          }
        },
        onDrop: () => {
          setGroupDragged(false);
        },
      }),
    );
  }, []);

  const isShiftPressed = useKeyDownListener("Shift");

  return (
    <>
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col min-w-[100px] ",
          closestEdge === "mid" && "ring-2 ring-primary-500 rounded-2xl",
          groupDragged ? "opacity-25" : "opacity-100",
          isShiftPressed &&
            "[&>:not(:last-child):hover]:mb-[90px] [&>:not(:last-child)]:transition-[margin]",
          className,
        )}
      >
        {children}

        {closestEdge && closestEdge !== "mid" && (
          <DropIndicator edge={closestEdge} gap={"8px"} />
        )}
      </div>
    </>
  );
};
