import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { GripVerticalIcon, TrashIcon } from "lucide-react";
import React, { RefObject, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { cn } from "@/common/Util";
import { Button } from "@/component/atoms/button/Button";
import { Input } from "@/component/atoms/input/Input";
import {
  getColumnData,
  isColumnData,
  isDraggingAColumn,
} from "@/component/molecules/board_creator/data";

export interface BoardCreatorColumnProps {
  id: string;
  name: string;
  desc: string;
  onChange: (column: { name: string; desc: string | null }) => void;
  onDelete: () => void;
  withDescription?: boolean;
  className?: string;
}

type ColumnState =
  | {
      type: "idle";
    }
  | {
      type: "is-dragging";
    }
  | {
      type: "is-dragging-and-left-self";
    }
  | {
      type: "is-over";
      dragging: DOMRect;
      closestEdge: Edge;
    };

const BoardColumnShadow = ({ dragging }: { dragging: DOMRect }) => {
  return (
    <div
      className="flex-shrink-0 rounded-2xl bg-secondary-500/50"
      style={{ width: dragging.width }}
    />
  );
};

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
    <div
      ref={outerRef}
      className={cn(
        "flex flex-shrink-0 flex-row gap-2",
        state.type === "is-dragging-and-left-self" && "hidden",
      )}
    >
      {state.type === "is-over" && state.closestEdge === "left" ? (
        <BoardColumnShadow dragging={state.dragging} />
      ) : null}

      <div
        ref={innerRef}
        data-testid={"column-create"}
        className={cn(
          "flex flex-col gap-2 min-w-[300px] max-w-[300px] bg-secondary-500 p-2 rounded-xl",
          state.type === "is-dragging" && "opacity-40",
          className,
        )}
      >
        <div className={"flex justify-center items-center gap-2"}>
          <div ref={handleRef} className={"cursor-grab"}>
            <GripVerticalIcon className={"size-6"} />
          </div>

          <Input
            data-testid={"column-name"}
            maxLength={35}
            value={name}
            setValue={(name) => {
              onChange({
                name: name,
                desc: desc,
              });
            }}
            placeholder="Nazwa Kolumny"
          />

          <Button
            data-testid={"remove-column"}
            size={"sm"}
            variant={"destructive"}
            onClick={onDelete}
          >
            <TrashIcon className={"size-5"} />
          </Button>
        </div>

        {withDescription && (
          <Input
            data-testid={"column-description"}
            multiline
            value={desc}
            setValue={(desc) =>
              onChange({
                name: name,
                desc: desc,
              })
            }
            placeholder="Opis"
          />
        )}
      </div>

      {state.type === "is-over" && state.closestEdge === "right" ? (
        <BoardColumnShadow dragging={state.dragging} />
      ) : null}
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
}) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ColumnState>({ type: "idle" });

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
        getIsSticky: () => true,

        getData: ({ element, input }) => {
          const data = getColumnData({
            column: { id, name, desc },
            rect: element.getBoundingClientRect(),
          });
          return attachClosestEdge(data, {
            element,
            input,
            allowedEdges: ["left", "right"],
          });
        },
        canDrop({ source }) {
          return isDraggingAColumn({ source });
        },
        onDragEnter({ source, self }) {
          if (isColumnData(source.data) && source.data.column.id !== id) {
            const closestEdge = extractClosestEdge(self.data);
            if (!closestEdge) {
              return;
            }

            setState({
              type: "is-over",
              dragging: source.data.rect,
              closestEdge,
            });
          }
        },
        onDrag({ source, self }) {
          if (!isColumnData(source.data)) {
            return;
          }
          if (source.data.column.id === id) {
            return;
          }
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) {
            return;
          }
          setState({
            type: "is-over",
            dragging: source.data.rect,
            closestEdge,
          });
        },
        onDragLeave({ source }) {
          if (!isColumnData(source.data)) {
            return;
          }

          if (source.data.column.id === id) {
            setState({ type: "is-dragging-and-left-self" });
            return;
          }

          setState({ type: "idle" });
        },
        onDrop() {
          setState({ type: "idle" });
        },
      }),
    );
  }, [id]);

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
