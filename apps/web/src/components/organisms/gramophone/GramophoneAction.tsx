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
        "flex flex-col absolute top-12 right-12 bg-card rounded-xl p-2 shadow-lg gap-2"
      }
      ref={gramophonePopover}
    >
      <div className={"flex flex-col gap-2 items-center rounded-lgtext-3xl"}>
        <div className={"flex text-3xl font-harlow-solid-italic items-center"}>
          Gramofon
        </div>

        <Gramophone
          activeVinyl={activeVinyl}
          onVinylDropped={(vinyl) => {
            setActiveVinyl(vinyl);
          }}
        />

        {activeVinyl && (
          <div className={"flex flex-row items-center gap-2"}>
            <div className={"flex flex-col gap-2"}>
              <div className={"text-sm"}>{activeVinyl.name}</div>
              <div className={"text-xs"}>{activeVinyl.author}</div>
            </div>
          </div>
        )}

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

        onVinylDropped(VINYLS.find((v) => v.id === vinyl.id)!);
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
        "size-24 rounded-full",
        isDragOver ? "border-2 border-dashed" : "",
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

        onVinylDropped(VINYLS.find((v) => v.id === vinyl.id)!);
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
        "size-32 rounded-lg flex items-center justify-center bg-secondary",
        isDragOver ? "border-2 border-dashed" : "",
      )}
    >
      {activeVinyl ? (
        <DraggableVinyl
          className={"animate-[spin_5s_linear_infinite]"}
          data={activeVinyl}
        />
      ) : (
        <div className={"text-center text-sm"}>Upuść płytę tutaj</div>
      )}
    </div>
  );
};
