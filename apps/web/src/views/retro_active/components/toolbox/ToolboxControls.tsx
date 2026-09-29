import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ThumbsUpIcon,
} from "lucide-react";
import type { Ref } from "react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { useRetro } from "@/context/retro/RetroContext.hook";
import useClickOutside from "@/hooks/useClickOutside";
import { pluralText } from "@/lib/pluralText";
import { WarmupToolbarActions } from "./WarmupToolbarActions";

type RetroActions = ReturnType<typeof useRetro>;
type NavigationProps = Pick<
  RetroActions,
  | "warmup"
  | "startWarmupDraw"
  | "completeWarmup"
  | "nextRoomState"
  | "prevRoomState"
> & {
  isAdmin: boolean;
  isWarmup: boolean;
  nextDisabled: boolean;
  prevDisabled: boolean;
};
export function ToolboxNavigation({
  isAdmin,
  isWarmup,
  warmup,
  startWarmupDraw,
  completeWarmup,
  nextRoomState,
  prevRoomState,
  nextDisabled,
  prevDisabled,
}: NavigationProps) {
  if (isWarmup) {
    if (isAdmin) {
      const canContinueWarmup =
        warmup?.status === "pending" || warmup?.status === "revealed";
      const continueWarmup = () => {
        if (warmup?.status === "pending") {
          startWarmupDraw();
        } else if (warmup?.status === "revealed") {
          completeWarmup();
        }
      };
      const continueWarmupLabel =
        warmup?.status === "pending"
          ? "Rozpocznij losowanie"
          : "Przejdź do retrospektywy";

      return (
        <div className="flex h-full justify-between gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="h-full grow p-0"
                  size="sm"
                  aria-label="Poprzedni etap"
                  disabled
                />
              }
            >
              <ArrowLeftIcon className="size-6" />
            </TooltipTrigger>
            <TooltipContent>Poprzedni etap</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="h-full grow p-0"
                  aria-label={continueWarmupLabel}
                  disabled={!canContinueWarmup}
                  onClick={continueWarmup}
                />
              }
            >
              <ArrowRightIcon className="size-6" />
            </TooltipTrigger>
            <TooltipContent>{continueWarmupLabel}</TooltipContent>
          </Tooltip>
        </div>
      );
    }
  } else if (isAdmin) {
    return (
      <div className="flex h-full justify-between gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                className="h-full grow p-0"
                size="sm"
                aria-label="Poprzedni etap"
                disabled={prevDisabled}
                onClick={prevRoomState}
              />
            }
          >
            <ArrowLeftIcon className="size-6" />
          </TooltipTrigger>
          <TooltipContent>Poprzedni etap</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                className="h-full grow p-0"
                aria-label="Następny etap"
                disabled={nextDisabled}
                onClick={nextRoomState}
              />
            }
          >
            <ArrowRightIcon className="size-6" />
          </TooltipTrigger>
          <TooltipContent>Następny etap</TooltipContent>
        </Tooltip>
      </div>
    );
  }
  return null;
}
export function ToolboxReadyControl({
  ready,
  setReady,
  readyPercentage,
}: Pick<RetroActions, "ready" | "setReady" | "readyPercentage">) {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              className="grow w-full"
              aria-label={ready ? "Cofnij gotowość" : "Oznacz jako gotowy"}
              onClick={() => setReady(!ready)}
            />
          }
        >
          <CheckIcon className="size-6" />
        </TooltipTrigger>
        <TooltipContent>
          {ready ? "Cofnij gotowość" : "Oznacz jako gotowy"}
        </TooltipContent>
      </Tooltip>
      <Progress value={readyPercentage} />
    </div>
  );
}
export function ToolboxVoteControl({
  maxVotes,
  setMaxVotesAmount,
}: Pick<RetroActions, "maxVotes" | "setMaxVotesAmount">) {
  const [isVoteOpen, setOpenVote] = useState(false);
  const votePopover = useRef<HTMLDivElement>(null);
  const closeVote = useCallback(() => setOpenVote(false), []);
  useClickOutside(votePopover, closeVote);
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              className="size-full"
              aria-label="Ustaw liczbę głosów"
              onClick={() => setOpenVote(true)}
            />
          }
        >
          <ThumbsUpIcon />
        </TooltipTrigger>
        <TooltipContent>Ustaw liczbę głosów</TooltipContent>
      </Tooltip>
      {isVoteOpen && (
        <div
          className="absolute bottom-[calc(100%+8px)] flex flex-col rounded-xl bg-card p-2 shadow-md"
          ref={votePopover}
        >
          <div className="text-center text-sm">
            {pluralText(maxVotes, {
              one: "głos",
              few: "głosy",
              other: "głosów",
            })}{" "}
            na osobę
          </div>
          <div className="flex h-[30px] w-full justify-between gap-2 bg-card pt-1">
            <Button
              className="grow"
              size="sm"
              onClick={() => maxVotes > 0 && setMaxVotesAmount(maxVotes - 1)}
            >
              -
            </Button>
            <div className="flex h-[30px] min-w-[50px] items-center justify-center rounded bg-background">
              {maxVotes}
            </div>
            <Button
              className="grow"
              size="sm"
              onClick={() => setMaxVotesAmount(maxVotes + 1)}
            >
              +
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

interface SecondaryActionProps
  extends Pick<RetroActions, "roomState" | "maxVotes" | "setMaxVotesAmount"> {
  isWarmup: boolean;
  isAdmin: boolean;
  warmupUrl: string | undefined;
  onOpenWarmupLink: () => void;
  shelfButtonRef: Ref<HTMLButtonElement>;
  onOpenShelf: () => void;
  hasReflectionCards: boolean;
}
export function ToolboxSecondaryAction({
  isWarmup,
  roomState,
  isAdmin,
  warmupUrl,
  onOpenWarmupLink,
  shelfButtonRef,
  onOpenShelf,
  hasReflectionCards,
  maxVotes,
  setMaxVotesAmount,
}: SecondaryActionProps) {
  if (isWarmup) {
    return (
      <WarmupToolbarActions
        action="open"
        destination={warmupUrl}
        enabled={Boolean(warmupUrl)}
        onClick={onOpenWarmupLink}
      />
    );
  } else if (roomState === "reflection") {
    return (
      <Button
        ref={shelfButtonRef}
        className="relative flex size-full flex-col items-center justify-center gap-4 border-2 border-primary border-dashed bg-background text-foreground"
        aria-label="Otwórz wrzutki"
        onClick={onOpenShelf}
      >
        Wrzutki
        {hasReflectionCards && (
          <div className="absolute bottom-1 left-4 right-4 h-2 animate-pulse rounded-full bg-destructive" />
        )}
      </Button>
    );
  } else if (roomState === "vote" && isAdmin) {
    return (
      <ToolboxVoteControl
        maxVotes={maxVotes}
        setMaxVotesAmount={setMaxVotesAmount}
      />
    );
  }
  return null;
}
