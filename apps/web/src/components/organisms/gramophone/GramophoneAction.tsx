import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Disc3Icon } from "lucide-react";
import React, { createRef, useEffect, useRef, useState } from "react";
import { DraggableVinyl } from "@/components/organisms/gramophone/DraggableVinyl";
import { getVinyl, isVinyl } from "@/components/organisms/gramophone/dragndrop";
import { VINYLS, Vinyl } from "@/components/organisms/gramophone/Vinyl";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGramophone } from "@/context/gramophone/GramophoneContext.hook";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

export const GramophoneAction: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentVinyl, playVinyl, stopVinyl } = useGramophone();

  useEffect(() => {
    if (!currentVinyl) return;

    return dropTargetForElements({
      element: document.body,
      canDrop: ({ source }) => {
        const data = source.data;
        return isVinyl(data) && currentVinyl !== null;
      },
      onDrop: (args) => {
        const data = args.source.data;
        if (!isVinyl(data)) {
          return;
        }

        const vinyl = getVinyl(data);
        // Only clear if the dropped vinyl matches the current vinyl
        if (vinyl.id === currentVinyl?.id) {
          stopVinyl();
        }
      },
    });
  }, [currentVinyl, stopVinyl]);

  return (
    <NavbarAction>
      <Button
        size={"icon"}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Disc3Icon
          className={cn(
            "size-5",
            !!currentVinyl && "animate-[spin_5s_linear_infinite]",
          )}
        />
      </Button>

      {isOpen && (
        <GramophoneModal
          activeVinyl={currentVinyl}
          onVinylChanged={(vinyl) => {
            if (vinyl) {
              playVinyl(vinyl);
            } else {
              stopVinyl();
            }
          }}
          onDismiss={() => {
            setIsOpen(false);
          }}
        />
      )}
    </NavbarAction>
  );
};

const GramophoneModal: React.FC<{
  onDismiss: () => void;
  activeVinyl: Vinyl | null;
  onVinylChanged: (vinyl: Vinyl | null) => void;
}> = ({ onDismiss, activeVinyl, onVinylChanged }) => {
  const gramophonePopover = createRef<HTMLDivElement>();

  useClickOutside(gramophonePopover, onDismiss);

  return (
    <div
      className={"z-10 flex flex-col absolute top-12 right-12 shadow-lg"}
      ref={gramophonePopover}
    >
      <div className={"flex flex-col gap-2 items-center rounded-lg text-3xl"}>
        <div
          className={"flex flex-col items-center bg-card rounded-xl p-2 gap-2"}
        >
          <div
            className={"flex text-3xl font-harlow-solid-italic items-center"}
          >
            Gramofon
          </div>

          <Gramophone
            activeVinyl={activeVinyl}
            onVinylDropped={(vinyl) => {
              onVinylChanged(vinyl);
            }}
          />
        </div>

        <div
          className={
            "bg-card rounded-xl flex flex-row gap-2 items-center justify-center"
          }
        >
          {VINYLS.map((vinyl, index) => (
            <div
              key={vinyl.id}
              className={cn(
                "flex flex-row items-center w-full p-2 gap-2",
                index !== 0 && "-ml-17",
              )}
            >
              <Tooltip>
                <TooltipTrigger>
                  <div className={"size-24 bg-black/20 rounded-full"}>
                    {activeVinyl?.id !== vinyl.id && (
                      <DraggableVinyl data={vinyl} />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side={"bottom"}
                  className={"flex flex-col gap-2"}
                >
                  <span className={"text-sm font-bold"}>{vinyl.name}</span>
                  <span className={"text-xs"}>{vinyl.author}</span>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Gramophone: React.FC<{
  activeVinyl: Vinyl | null;
  onVinylDropped: (vinyl: Vinyl) => void;
}> = ({ activeVinyl, onVinylDropped }) => {
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
        "relative w-50 h-36 rounded-lg flex items-center justify-center transition-shadow",
        isDragOver
          ? "shadow-lg ring-2 ring-offset-2 ring-primary"
          : "shadow-md",
      )}
    >
      {/* Gramophone body */}
      <div className="absolute inset-0 rounded-lg bg-linear-to-br from-gray-500 to-gray-600 opacity-60" />

      {/* Center vinyl area */}
      <div className="relative z-10 flex items-center justify-center w-full h-full pr-16">
        <div className="relative w-28 h-28">
          {/* Vinyl turntable */}
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

          {/* Tonearm */}
          <div className="absolute top-0 right-0 z-20 pointer-events-none">
            <div className="relative w-12 h-12">
              {/* Arm base */}
              <div className="absolute top-0 right-0 w-2 h-2 bg-gray-600 rounded-full" />
              {/* Arm rod pointing down-left to vinyl center */}
              <div
                className="absolute w-1 top-0.5 right-0.5 h-13 bg-linear-to-b from-gray-400 to-gray-600 rounded-full"
                style={{
                  transform: "rotate(12deg)",
                  transformOrigin: "top right",
                }}
              >
                {/* Needle tip */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-yellow-500 rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control buttons on the right side */}
      <div className="absolute top-6 right-4 w-3 h-3 rounded-full bg-gray-600 shadow-sm" />
      <div className="absolute top-12 right-4 w-3 h-3 rounded-full bg-gray-600 shadow-sm" />
      <div className="absolute bottom-6 right-4 w-3 h-3 rounded-full bg-destructive shadow-sm" />
    </div>
  );
};
