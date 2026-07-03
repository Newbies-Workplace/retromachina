import React from "react";
import { DraggableVinyl } from "@/components/organisms/gramophone/DraggableVinyl";
import { VINYLS, Vinyl } from "@/components/organisms/gramophone/Vinyl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const VinylPicker: React.FC<{
  activeVinyl: Vinyl | null;
  className?: string;
}> = ({ activeVinyl, className }) => {
  return (
    <div className={cn("flex flex-row gap-2 items-center", className)}>
      {VINYLS.map((vinyl, index) => (
        <div
          key={vinyl.id}
          className={cn(
            "flex flex-row items-center w-full p-2 gap-2",
            index !== 0 && "-ml-20",
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
            <TooltipContent side={"bottom"} className={"flex flex-col gap-2"}>
              <span className={"text-sm font-bold"}>{vinyl.name}</span>
              <span className={"text-xs"}>{vinyl.author}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  );
};
