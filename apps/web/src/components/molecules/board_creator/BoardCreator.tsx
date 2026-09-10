import React, { useRef } from "react";
import { cn } from "@/lib/utils";

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

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-2 scrollbar p-2 bg-secondary/20 rounded-2xl",
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement<{ onPreviewReorder?: ReorderCallback }>(child)
          ? React.cloneElement(child, {
              onPreviewReorder: onColumnReorder,
            })
          : child,
      )}
    </div>
  );
};
