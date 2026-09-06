import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Disc3Icon } from "lucide-react";
import React, { createRef, useState } from "react";
import { GramophonePlayer } from "@/components/organisms/gramophone/GramophonePlayer";
import { useVinylStopOnDrop } from "@/components/organisms/gramophone/useVinylStopOnDrop";
import { Vinyl } from "@/components/organisms/gramophone/Vinyl";
import { VinylPicker } from "@/components/organisms/gramophone/VinylPicker";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import { Button } from "@/components/ui/button";
import { useGramophone } from "@/context/gramophone/GramophoneContext.hook";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

export const GramophoneAction: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentVinyl, playVinyl, stopVinyl } = useGramophone();

  useVinylStopOnDrop();

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
      className={"z-10 flex flex-col absolute top-12 right-12"}
      ref={gramophonePopover}
    >
      <div className={"flex flex-col gap-2 items-center"}>
        <div
          className={
            "flex flex-col items-center bg-card rounded-xl p-2 gap-2 shadow"
          }
        >
          <div
            className={"flex text-3xl font-harlow-solid-italic items-center"}
          >
            Gramofon
          </div>

          <GramophonePlayer
            activeVinyl={activeVinyl}
            onVinylDropped={(vinyl) => {
              onVinylChanged(vinyl);
            }}
          />
        </div>

        <div
          className={
            "bg-card rounded-xl flex flex-row gap-2 items-center justify-center shadow"
          }
        >
          <VinylPicker activeVinyl={activeVinyl} />
        </div>
      </div>
    </div>
  );
};
