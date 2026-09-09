import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { GripVerticalIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const columnDragKey = "active-retro-column";

interface ColumnDragData {
  type: typeof columnDragKey;
  columnId: string;
}

const isColumnDragData = (
  value: Record<string | symbol, unknown>,
): value is ColumnDragData =>
  value.type === columnDragKey && typeof value.columnId === "string";

interface DraggableColumnProps {
  columnId: string;
  enabled: boolean;
  onPreviewReorder: (fromColumnId: string, toColumnId: string) => void;
  onDragEnd: (columnId: string) => void;
  children: (handle: React.ReactNode) => React.ReactNode;
}

export const DraggableColumn = ({
  columnId,
  enabled,
  onPreviewReorder,
  onDragEnd,
  children,
}: DraggableColumnProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const column = columnRef.current;
    const handle = handleRef.current;
    if (!enabled || !outer || !column || !handle) return;

    return combine(
      draggable({
        element: handle,
        getInitialData: (): ColumnDragData => ({
          type: columnDragKey,
          columnId,
        }),
        onGenerateDragPreview({ location, nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element: column,
              input: location.initial.input,
            }),
            render({ container }) {
              const preview = column.cloneNode(true) as HTMLElement;
              preview.style.width = `${column.getBoundingClientRect().width}px`;
              preview.style.pointerEvents = "none";
              container.append(preview);

              return () => preview.remove();
            },
          });
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => {
          setIsDragging(false);
          onDragEnd(columnId);
        },
      }),
      dropTargetForElements({
        element: outer,
        canDrop: ({ source }) =>
          isColumnDragData(source.data) && source.data.columnId !== columnId,
        getData: (): ColumnDragData => ({ type: columnDragKey, columnId }),
        onDragEnter: ({ source }) => {
          if (isColumnDragData(source.data)) {
            onPreviewReorder(source.data.columnId, columnId);
          }
        },
      }),
    );
  }, [columnId, enabled, onDragEnd, onPreviewReorder]);

  const handle = enabled ? (
    <div
      ref={handleRef}
      aria-hidden="true"
      className="flex cursor-grab items-center justify-center p-2 active:cursor-grabbing"
    >
      <GripVerticalIcon />
    </div>
  ) : null;

  return (
    <div ref={outerRef} className="h-full rounded-2xl">
      <div
        ref={columnRef}
        className={cn("h-full rounded-2xl", isDragging && "opacity-40")}
      >
        {children(handle)}
      </div>
    </div>
  );
};
