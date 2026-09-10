import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { GripVerticalIcon, TrashIcon } from "lucide-react";
import React, { RefObject, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import {
  getColumnData,
  isColumnData,
  isDraggingAColumn,
} from "@/components/molecules/board_creator/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface BoardCreatorColumnProps {
  id: string;
  name: string;
  desc: string;
  onChange: (column: { name: string; desc: string | null }) => void;
  onDelete: () => void;
  withDescription?: boolean;
  className?: string;
  onPreviewReorder?: (data: { fromId: string; toId: string }) => void;
}

type ColumnState = { type: "idle" } | { type: "is-dragging" };

export const BoardCreatorColumnDisplay = ({
  columnProps: {
    name,
    desc,
    onChange,
    onDelete,
    withDescription = false,
    className,
  },
  state,
  outerRef,
  innerRef,
  handleRef,
}: {
  columnProps: BoardCreatorColumnProps;
  state: ColumnState;
  outerRef?: RefObject<HTMLDivElement | null>;
  innerRef?: RefObject<HTMLDivElement | null>;
  handleRef?: RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div ref={outerRef} className="flex flex-shrink-0 flex-row gap-2">
      <div
        ref={innerRef}
        data-testid={"column-create"}
        className={cn(
          "flex flex-col gap-2 min-w-[300px] max-w-[300px] bg-secondary p-2 rounded-xl",
          state.type === "is-dragging" && "opacity-40",
          className,
        )}
      >
        <div className={"flex justify-center items-center gap-2"}>
          <div
            ref={handleRef}
            className={"cursor-grab"}
            data-testid="column-drag-handle"
          >
            <GripVerticalIcon className={"size-6"} />
          </div>

          <Input
            data-testid={"column-name"}
            maxLength={35}
            value={name}
            onChange={(e) => {
              onChange({
                name: e.target.value,
                desc: desc,
              });
            }}
            placeholder="Nazwa Kolumny"
          />

          <Button
            data-testid={"remove-column"}
            size={"icon"}
            variant={"destructive"}
            onClick={onDelete}
          >
            <TrashIcon className={"size-4"} />
          </Button>
        </div>

        {withDescription && (
          <Textarea
            data-testid={"column-description"}
            value={desc}
            onChange={(e) =>
              onChange({
                name: name,
                desc: e.target.value,
              })
            }
            placeholder="Opis"
          />
        )}
      </div>
    </div>
  );
};

export const BoardCreatorColumn: React.FC<BoardCreatorColumnProps> = ({
  id,
  name,
  desc,
  onChange,
  onDelete,
  withDescription = false,
  className,
  onPreviewReorder,
}) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const onPreviewReorderRef = useRef(onPreviewReorder);
  const [state, setState] = useState<ColumnState>({ type: "idle" });

  useEffect(() => {
    onPreviewReorderRef.current = onPreviewReorder;
  }, [onPreviewReorder]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const handle = handleRef.current;

    invariant(outer && inner && handle);

    return combine(
      draggable({
        element: inner,
        dragHandle: handle,
        getInitialData: ({ element }) =>
          getColumnData({
            column: { id, name, desc },
            rect: element.getBoundingClientRect(),
          }),
        onDragStart() {
          setState({ type: "is-dragging" });
        },
        onDrop() {
          setState({ type: "idle" });
        },
      }),
      dropTargetForElements({
        element: outer,
        getData: ({ element }) =>
          getColumnData({
            column: { id, name, desc },
            rect: element.getBoundingClientRect(),
          }),
        canDrop({ source }) {
          return (
            isDraggingAColumn({ source }) &&
            isColumnData(source.data) &&
            source.data.column.id !== id
          );
        },
        onDragEnter({ source }) {
          if (isColumnData(source.data) && source.data.column.id !== id) {
            onPreviewReorderRef.current?.({
              fromId: source.data.column.id,
              toId: id,
            });
          }
        },
      }),
    );
  }, [desc, id, name]);

  return (
    <BoardCreatorColumnDisplay
      outerRef={outerRef}
      innerRef={innerRef}
      handleRef={handleRef}
      state={state}
      columnProps={{
        id,
        name,
        desc,
        onChange,
        onDelete,
        withDescription,
        className,
      }}
    />
  );
};
