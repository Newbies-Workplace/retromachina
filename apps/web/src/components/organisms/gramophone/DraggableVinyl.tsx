import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { centerUnderPointer } from "@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import invariant from "tiny-invariant";
import { getVinyl } from "@/components/organisms/gramophone/dragndrop";
import { Vinyl } from "@/components/organisms/gramophone/Vinyl";
import { VinylDisc } from "@/components/organisms/gramophone/VinylDisc";
import { cn } from "@/lib/utils";

export const DraggableVinyl: React.FC<{
  className?: string;
  data: Vinyl;
}> = ({ className, data }) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = dragRef.current;

    invariant(element);

    return draggable({
      element,
      getInitialData: () => getVinyl(data),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
      onGenerateDragPreview({ nativeSetDragImage }) {
        setCustomNativeDragPreview({
          render({ container }) {
            const root = createRoot(container);
            root.render(<VinylDisc data={data} />);

            return () => {
              root.unmount();
            };
          },
          nativeSetDragImage,
          getOffset: centerUnderPointer,
        });
      },
    });
  }, [data]);

  return (
    <div
      className={cn(
        "relative size-24 min-w-24 min-h-24 transition-opacity",
        isDragging && "opacity-0",
        "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <VinylDisc dragRef={dragRef} data={data} />
    </div>
  );
};
