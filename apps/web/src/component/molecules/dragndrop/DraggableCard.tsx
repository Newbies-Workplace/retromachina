import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { scrollJustEnoughIntoView } from "@atlaskit/pragmatic-drag-and-drop/element/scroll-just-enough-into-view";
import React, { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { getCard } from "./dragndrop";

interface DraggableCardProps {
  parentCardId: string | null;
  cardId: string;
  columnId: string;
  style?: React.CSSProperties;
}

export const DraggableCard: React.FC<
  React.PropsWithChildren<DraggableCardProps>
> = ({ children, parentCardId, cardId, columnId, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    return combine(
      draggable({
        element: element,
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
        getInitialData: () => getCard({ cardId, columnId, parentCardId }),
        onGenerateDragPreview({ source }) {
          scrollJustEnoughIntoView({ element: source.element });
        },
      }),
    );
  }, []);

  const opacity = dragging ? 0.25 : 1;

  return (
    <div
      ref={ref}
      style={{ opacity: opacity, ...style }}
      className={"cursor-grab"}
    >
      {children}
    </div>
  );
};
