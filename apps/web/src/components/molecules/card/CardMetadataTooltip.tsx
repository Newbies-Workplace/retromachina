import dayjs from "dayjs";
import { InfoIcon } from "lucide-react";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CardMetadataTooltipProps {
  createdAt: Date;
  updatedAt: Date;
}

export const CardMetadataTooltip: React.FC<CardMetadataTooltipProps> = ({
  createdAt,
  updatedAt,
}) => {
  return (
    <div className={"mt-auto self-end h-6"}>
      <Tooltip>
        <TooltipTrigger>
          <InfoIcon className={"size-6 p-1 rounded-full hover:bg-white/50"} />
        </TooltipTrigger>
        <TooltipContent side={"bottom"} className={"flex flex-col gap-2"}>
          <div className={"flex flex-row justify-between gap-1"}>
            <span className={"text-xs font-bold"}>Stworzono:</span>
            <span className={"text-xs"}>
              {dayjs(createdAt).format("DD.MM.YYYY HH:mm")}
            </span>
          </div>
          <div className={"flex flex-row justify-between gap-1"}>
            <span className={"text-xs font-bold"}>Zaktualizowano:</span>
            <span className={"text-xs"}>
              {dayjs(updatedAt).format("DD.MM.YYYY HH:mm")}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
