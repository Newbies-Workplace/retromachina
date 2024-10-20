import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { scrollJustEnoughIntoView } from "@atlaskit/pragmatic-drag-and-drop/element/scroll-just-enough-into-view";
import React, { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import dropCardAudio from "../../../assets/sounds/card-drop.wav";
import pickCardAudio from "../../../assets/sounds/card-pick.wav";
import { cn } from "../../../common/Util";
import { getCard } from "./dragndrop";

interface DraggableCardProps {
  className?: string;
  parentCardId: string | null;
  cardId: string;
  columnId: string;
  children?: React.ReactNode;
  changeOpacityOnDrag?: boolean;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  children,
  parentCardId,
  cardId,
  columnId,
  className,
  changeOpacityOnDrag = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const pickAudio = new Audio(pickCardAudio);
  const dropAudio = new Audio(dropCardAudio);

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    return combine(
      draggable({
        element: element,
        onDragStart: () => {
          setDragging(true);
          pickAudio.play();
        },
        onDrop: () => {
          setDragging(false);
          dropAudio.play();
        },
        getInitialData: () => getCard({ cardId, columnId, parentCardId }),
        onGenerateDragPreview({ source }) {
          scrollJustEnoughIntoView({ element: source.element });
        },
      }),
    );
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "cursor-grab",
        // don't show opacity when dragging first card in group so that opacity is not applied twice to first card in group
        dragging && (changeOpacityOnDrag || parentCardId !== null)
          ? "opacity-25"
          : "opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
};
