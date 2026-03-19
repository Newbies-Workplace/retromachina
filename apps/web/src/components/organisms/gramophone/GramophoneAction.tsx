import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Disc3Icon } from "lucide-react";
import React, { createRef, useEffect, useRef, useState } from "react";
import { DraggableVinyl } from "@/components/organisms/gramophone/DraggableVinyl";
import { getVinyl, isVinyl } from "@/components/organisms/gramophone/dragndrop";
import { VINYLS, Vinyl } from "@/components/organisms/gramophone/Vinyl";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import { Button } from "@/components/ui/button";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

export const GramophoneAction: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NavbarAction>
      <Button
        size={"icon"}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Disc3Icon className={"size-5"} />
      </Button>

      {isOpen && (
        <GramophoneModal
          onDismiss={() => {
            setIsOpen(false);
          }}
        />
      )}
    </NavbarAction>
  );
};

const GramophoneModal: React.FC<{ onDismiss: () => void }> = ({
  onDismiss,
}) => {
  const gramophonePopover = createRef<HTMLDivElement>();

  useClickOutside(gramophonePopover, onDismiss);

  const [activeVinyl, setActiveVinyl] = useState<Vinyl | null>(null);

  return (
    <div
      className={
        "z-10 flex flex-col absolute top-12 right-12 bg-card rounded-xl p-2 shadow-lg gap-2"
      }
      ref={gramophonePopover}
    >
      <div className={"flex flex-col gap-2 items-center rounded-lg text-3xl"}>
        <div className={"flex text-3xl font-harlow-solid-italic items-center"}>
          Gramofon
        </div>

        <Gramophone
          activeVinyl={activeVinyl}
          onVinylDropped={(vinyl) => {
            setActiveVinyl(vinyl);
          }}
        />

        <div className={"flex flex-col gap-2 items-center justify-center"}>
          {VINYLS.map((vinyl) => (
            <div
              key={vinyl.id}
              className={"flex flex-row items-start w-full p-2 gap-2"}
            >
              <div className={"size-24 bg-black/20 rounded-full"}>
                {activeVinyl === vinyl ? (
                  <VinylDropzone
                    activeVinyl={activeVinyl}
                    onVinylDropped={() => {
                      setActiveVinyl(null);
                    }}
                  />
                ) : (
                  <DraggableVinyl data={vinyl} />
                )}
              </div>

              <div className={"flex flex-col text-sm justify-center"}>
                <span>{vinyl.name}</span>
                <span>{vinyl.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VinylDropzone: React.FC<{
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

        if (!isVinyl(data)) {
          return false;
        }

        const vinyl = getVinyl(data);

        return vinyl.id === activeVinyl?.id;
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
  }, [onVinylDropped, activeVinyl?.id]);

  return (
    <div
      ref={dropzoneRef}
      className={cn(
        "size-24 rounded-full transition-colors",
        isDragOver
          ? "ring-2 ring-offset-2 ring-offset-background ring-primary"
          : "",
      )}
    />
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
        "relative w-50 h-36 rounded-lg bg-linear-to-br from-amber-100 to-amber-200 flex items-center justify-center transition-shadow",
        isDragOver
          ? "shadow-lg ring-2 ring-offset-2 ring-primary"
          : "shadow-md",
      )}
    >
      {/* Gramophone body */}
      <div className="absolute inset-0 rounded-lg bg-linear-to-br from-amber-50 to-amber-300 opacity-40" />

      {/* Center vinyl area */}
      <div className="relative z-10 flex items-center justify-center w-full h-full pr-16">
        <div className="relative w-28 h-28">
          {/* Vinyl turntable */}
          <div className="absolute inset-0 rounded-full bg-gray-900 flex items-center justify-center shadow-lg">
            {activeVinyl ? (
              <div className="w-24 h-24 animate-[spin_5s_linear_infinite]">
                <DraggableVinyl data={activeVinyl} />
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-gray-600 to-gray-900" />
              </div>
            )}
          </div>

          {/* Tonearm */}
          <div className="absolute top-0 right-0 z-20">
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
