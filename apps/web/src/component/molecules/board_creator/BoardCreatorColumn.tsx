import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
import { GripVerticalIcon, TrashIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { cn } from "@/common/Util";
import { Button } from "@/component/atoms/button/Button";
import { Input } from "@/component/atoms/input/Input";

export interface BoardCreatorColumnProps {
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
    }
  | {
      type: "preview";
      container: HTMLElement;
      dragging: DOMRect;
    };

export const BoardCreatorColumn: React.FC<BoardCreatorColumnProps> = ({
  name,
  desc,
  onChange,
  onDelete,
  withDescription = false,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    const handleElement = handleRef.current;

    invariant(element);
    invariant(handleElement);

    return combine(
      draggable({
        element: element,
        dragHandle: handleElement,
      }),
    );
  }, []);

  return (
    <div
      ref={ref}
      data-testid={"column-create"}
      className={cn(
        "flex flex-col gap-2 min-w-[300px] max-w-[300px] bg-secondary-500 p-2 rounded-xl",
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
  );
};
