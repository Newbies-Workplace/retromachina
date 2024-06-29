import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
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
      }),
    );
  }, []);

  const opacity = dragging ? 0.25 : 1;
  const cursor = "grab"; // canDrag ? "grab" : "default";

  return (
    <div ref={ref} style={{ opacity: opacity, cursor: cursor, ...style }}>
      {children}
    </div>
  );
};
