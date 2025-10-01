import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import React, { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { cn } from "@/common/Util";

interface BoardCreatorProps {
  children?: React.ReactNode;
  className?: string;
}

export const BoardCreator: React.FC<BoardCreatorProps> = ({
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    return combine();
  }, []);

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
