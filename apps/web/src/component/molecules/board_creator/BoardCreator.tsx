import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect, useRef } from "react";
import { cn } from "@/common/Util";
import {
  isColumnData,
  isDraggingAColumn,
} from "@/component/molecules/board_creator/data";

type ReorderCallback = (data: { fromId: string; toId: string }) => void;

interface BoardCreatorProps {
  onColumnReorder: ReorderCallback;
  children?: React.ReactNode;
  className?: string;
}

export const BoardCreator: React.FC<BoardCreatorProps> = ({
  onColumnReorder,
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor: isDraggingAColumn,
        onDrop({ source, location }) {
          const dragging = source.data;
          if (!isColumnData(dragging)) {
            return;
          }

          const innerMost = location.current.dropTargets[0];
          if (!innerMost) {
            return;
          }
          const dropTargetData = innerMost.data;

          if (!isColumnData(dropTargetData)) {
            return;
          }

          onColumnReorder({
            fromId: dragging.column.id,
            toId: dropTargetData.column.id,
          });

          return;
        },
      }),
    );
  }, [onColumnReorder]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-2 scrollbar p-2 bg-secondary-500/20 rounded-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
};
