import { DicesIcon, ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type WarmupToolbarAction = "start" | "reroll" | "open";

interface WarmupToolbarActionsProps {
  action: WarmupToolbarAction;
  destination?: string;
  enabled?: boolean;
  onClick: () => void;
}

const actionLabels: Record<WarmupToolbarAction, string> = {
  start: "Rozpocznij losowanie",
  reroll: "Losuj ponownie",
  open: "Otwórz udostępniony link do rozgrzewki",
};

export function WarmupToolbarActions({
  action,
  destination,
  enabled = true,
  onClick,
}: WarmupToolbarActionsProps) {
  const [isWaitingTooltipOpen, setIsWaitingTooltipOpen] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const label = actionLabels[action];
  const isWaitingForRoom = action === "open" && !enabled;
  const tooltipLabel = isWaitingForRoom
    ? "Poczekaj, aż prowadzący założy pokój i udostępni link."
    : label;
  const tooltipContent =
    action === "open" && destination ? (
      <span className="block max-w-xs break-all">
        Otwórz: {destination.replace(/^https?:\/\/(www\.)?/i, "")}
      </span>
    ) : (
      tooltipLabel
    );
  const content =
    action === "start" || action === "reroll" ? (
      <>
        <DicesIcon className="size-6 shrink-0" />
        <span>{label}</span>
      </>
    ) : (
      <>
        <ExternalLinkIcon />
        <span>Otwórz link</span>
      </>
    );

  useEffect(
    () => () => {
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
    },
    [],
  );

  const openWaitingTooltip = () => {
    tooltipTimeout.current = setTimeout(() => {
      setIsWaitingTooltipOpen(true);
    }, 700);
  };

  const closeWaitingTooltip = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = null;
    }
    setIsWaitingTooltipOpen(false);
  };

  return (
    <Tooltip
      open={isWaitingForRoom ? isWaitingTooltipOpen : undefined}
      onOpenChange={isWaitingForRoom ? setIsWaitingTooltipOpen : undefined}
    >
      {isWaitingForRoom ? (
        <TooltipTrigger
          disabled
          render={
            <span
              className="block size-full"
              onMouseEnter={openWaitingTooltip}
              onMouseLeave={closeWaitingTooltip}
            />
          }
        >
          <Button
            className="size-full flex-col gap-1 px-1 text-xs"
            aria-label={label}
            data-testid={`warmup-action-${action}`}
            disabled
          >
            {content}
          </Button>
        </TooltipTrigger>
      ) : (
        <TooltipTrigger
          render={
            <Button
              className="size-full flex-col gap-1 px-1 text-xs"
              aria-label={label}
              data-testid={`warmup-action-${action}`}
              disabled={!enabled}
              onClick={onClick}
            />
          }
        >
          {content}
        </TooltipTrigger>
      )}
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}
