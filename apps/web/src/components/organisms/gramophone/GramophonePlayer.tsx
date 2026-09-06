import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect, useRef, useState } from "react";
import { DraggableVinyl } from "@/components/organisms/gramophone/DraggableVinyl";
import { getVinyl, isVinyl } from "@/components/organisms/gramophone/dragndrop";
import { VINYLS, Vinyl } from "@/components/organisms/gramophone/Vinyl";
import { MusicPreferenceSlider } from "@/components/organisms/menu/PreferencesDialogContent";
import { cn } from "@/lib/utils";

export const GramophonePlayer: React.FC<{
  activeVinyl: Vinyl | null;
  onVinylDropped: (vinyl: Vinyl) => void;
  className?: string;
}> = ({ activeVinyl, onVinylDropped, className }) => {
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const element = dropzoneRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => {
        const data = source.data;
        return isVinyl(data);
      },
      onDrop: (args) => {
        const data = args.source.data;
        if (!isVinyl(data)) {
          return;
        }

        const vinyl = getVinyl(data);
        const foundVinyl = VINYLS.find((v) => v.id === vinyl.id);
        if (foundVinyl) {
          onVinylDropped(foundVinyl);
        }
        setIsDragOver(false);
      },
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
    });
  }, [onVinylDropped]);

  return (
    <div
      ref={dropzoneRef}
      className={cn(
        "relative w-50 h-38 rounded-lg flex items-center justify-center transition-shadow",
        isDragOver
          ? "shadow-lg ring-2 ring-offset-2 ring-primary"
          : "shadow-md",
        className,
      )}
    >
      <div className="absolute inset-0 rounded-lg bg-linear-to-br from-gray-500 to-gray-600 opacity-60" />

      <div className="relative z-10 flex p-4 w-full h-full pr-16">
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-gray-900 flex items-center justify-center shadow-lg">
            {activeVinyl ? (
              <div className="pointer-events-auto w-24 h-24 animate-[spin_5s_linear_infinite]">
                <DraggableVinyl data={activeVinyl} />
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-gray-600 to-gray-900" />
              </div>
            )}
          </div>

          <div className="absolute top-0 right-0 z-20 pointer-events-none">
            <div className="relative w-12 h-12">
              <div className="absolute top-0 right-0 w-2 h-2 bg-gray-600 rounded-full" />
              <div
                className="absolute w-1 top-0.5 right-0.5 h-13 bg-linear-to-b from-gray-400 to-gray-600 rounded-full"
                style={{
                  transform: "rotate(12deg)",
                  transformOrigin: "top right",
                }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-yellow-500 rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={"absolute bottom-2 left-2 right-2 z-10"}>
        <MusicPreferenceSlider />
      </div>

      <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-gray-600 shadow-sm" />
      <div className="absolute top-10 right-4 w-3 h-3 rounded-full bg-gray-600 shadow-sm" />
      <div className="absolute bottom-8 right-4 w-3 h-3 rounded-full bg-destructive shadow-sm" />
    </div>
  );
};
