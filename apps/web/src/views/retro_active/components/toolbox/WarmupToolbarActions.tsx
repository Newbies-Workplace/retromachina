import { ArrowRightIcon, CopyIcon, DicesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type WarmupToolbarAction = "start" | "reroll" | "copy" | "complete";

interface WarmupToolbarActionsProps {
  action: WarmupToolbarAction;
  enabled?: boolean;
  onClick: () => void;
}

const actionLabels: Record<WarmupToolbarAction, string> = {
  start: "Rozpocznij losowanie",
  reroll: "Losuj ponownie",
  copy: "Skopiuj link do rozgrzewki",
  complete: "Przejdź do retrospektywy",
};

export function WarmupToolbarActions({
  action,
  enabled = true,
  onClick,
}: WarmupToolbarActionsProps) {
  const label = actionLabels[action];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            className="size-full flex-col gap-1 px-1 text-xs"
            aria-label={label}
            disabled={!enabled}
            onClick={onClick}
          />
        }
      >
        {action === "start" || action === "reroll" ? (
          <>
            <DicesIcon className="size-6 shrink-0" />
            <span>{label}</span>
          </>
        ) : action === "copy" ? (
          <>
            <CopyIcon />
            <span>Kopiuj link</span>
          </>
        ) : (
          <>
            <ArrowRightIcon />
            <span>Do retro</span>
          </>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
