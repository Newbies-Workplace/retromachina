import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  FlagIcon,
  ThumbsUpIcon,
} from "lucide-react";
import React, {
  createRef,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import invariant from "tiny-invariant";
import SlotMachineIcon from "@/assets/icons/slot-machine-icon.svg";
import { isCard } from "@/components/molecules/dragndrop/dragndrop";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfirm } from "@/context/confirm/ConfirmContext.hook";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import useClickOutside from "@/hooks/useClickOutside";
import { useTeamRole } from "@/hooks/useTeamRole";
import { groupCards } from "@/lib/groupCards";
import { pluralText } from "@/lib/pluralText";
import { useReflectionCardStore } from "@/store/useReflectionCardStore";
import { ReflectionCardsShelf } from "@/views/retro_active/components/toolbox/ReflectionCardsShelf";
import { ToolboxSlotMachine } from "@/views/retro_active/components/toolbox/ToolboxSlotMachine";
import { WarmupToolbarActions } from "@/views/retro_active/components/toolbox/WarmupToolbarActions";

const TOOLBAR_SLOT = {
  leading: 0,
  roomAction: 1,
  secondaryAction: 2,
  ready: 3,
  summary: 4,
  navigation: 5,
  finish: 6,
} as const;

const toolbarSlotKeys = [
  "leading",
  "roomAction",
  "secondaryAction",
  "ready",
  "summary",
  "navigation",
  "finish",
] as const;

export const Toolbox: React.FC = () => {
  const { showConfirm } = useConfirm();
  const {
    cards,
    discussionCardId,
    roomState,
    teamId,
    ready,
    setReady,
    readyPercentage,
    nextRoomState,
    prevRoomState,
    maxVotes,
    setMaxVotesAmount,
    votes,
    endRetro,
    slotMachineVisible,
    setSlotMachineVisible,
    deleteCard,
    warmup,
    startWarmupDraw,
    completeWarmup,
  } = useRetro();

  const { isAdmin } = useTeamRole(teamId!);
  const { addReflectionCard, fetchReflectionCards } = useReflectionCardStore();
  const hasReflectionCards = useReflectionCardStore(
    (state) => state.reflectionCards.length > 0,
  );

  const { user } = useUser();
  const userVotes =
    maxVotes - votes.filter((vote) => user?.id === vote.voterId).length;
  const groups = groupCards(cards, votes).sort(
    (a, b) => b.votes.length - a.votes.length,
  );
  const currentIndex = groups.findIndex(
    (g) => g.parentCardId === discussionCardId,
  );
  const targetIndex = currentIndex + 1;
  const nextDisabled =
    (roomState === "discuss" && targetIndex >= groups.length) ||
    cards.length <= 0;
  const prevDisabled = roomState === "reflection";
  const isVotingVisible = roomState === "vote";
  const isWarmup = roomState === "warmup";
  const isWarmupDrawAction =
    isWarmup &&
    isAdmin &&
    (warmup?.status === "pending" || warmup?.status === "revealed");
  const warmupUrl = warmup?.sharedRoomUrl ?? warmup?.result?.url;

  const [isVoteOpen, setOpenVote] = useState(false);

  const votePopover = createRef<HTMLDivElement>();
  const closeVote = useCallback(() => setOpenVote(false), []);
  useClickOutside(votePopover, closeVote);

  const reflectionCardsShelfButtonRef = createRef<HTMLButtonElement>();
  const [isReflectionCardsShelfOpen, setIsReflectionCardsShelfOpen] =
    useState(false);

  useEffect(() => {
    if (!teamId || roomState !== "reflection") {
      return;
    }

    const element = reflectionCardsShelfButtonRef.current;

    invariant(element);

    return combine(
      dropTargetForElements({
        element: element,
        canDrop: ({ source }) => isCard(source.data),
        onDrag: () => {
          setIsReflectionCardsShelfOpen(true);
        },
      }),
    );
  }, [teamId, roomState]);

  useEffect(() => {
    if (!teamId) {
      return;
    }

    fetchReflectionCards(teamId).then();
  }, [fetchReflectionCards, teamId]);

  if (!teamId) {
    return null;
  }

  const onFinishRetroPress = () => {
    showConfirm({
      title: "Zakończenie retrospektywy",
      content: "Czy na pewno chcesz zakończyć retrospektywę?",
      onConfirmed: endRetro,
    });
  };

  const onCopyWarmupLink = async () => {
    if (!warmupUrl) return;

    try {
      await navigator.clipboard.writeText(warmupUrl);
      toast.success("Link do rozgrzewki skopiowano do schowka");
    } catch {
      toast.error("Nie udało się skopiować linku do rozgrzewki");
    }
  };

  const onCardDrop = async (cardId: string) => {
    const card = cards.find((card) => card.id === cardId);

    if (!card) {
      return;
    }

    addReflectionCard(teamId, card.text).then(() => {
      deleteCard(cardId);
    });
  };

  const toolbarSlots: ReactNode[] = Array.from(
    { length: toolbarSlotKeys.length },
    () => null,
  );

  if (isWarmup && isAdmin && warmup?.status === "pending") {
    toolbarSlots[TOOLBAR_SLOT.leading] = (
      <WarmupToolbarActions action="start" onClick={startWarmupDraw} />
    );
  } else if (isWarmup && isAdmin && warmup?.status === "revealed") {
    toolbarSlots[TOOLBAR_SLOT.leading] = (
      <WarmupToolbarActions action="reroll" onClick={startWarmupDraw} />
    );
  }

  if (isAdmin && roomState === "group") {
    toolbarSlots[TOOLBAR_SLOT.roomAction] = (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              className="size-full"
              aria-label="Otwórz losowanie"
              onClick={() => setSlotMachineVisible(!slotMachineVisible)}
            />
          }
        >
          <SlotMachineIcon className="size-7" />
        </TooltipTrigger>
        <TooltipContent>Otwórz losowanie</TooltipContent>
      </Tooltip>
    );
  }

  if (isWarmup) {
    toolbarSlots[TOOLBAR_SLOT.secondaryAction] = (
      <WarmupToolbarActions
        action="copy"
        enabled={Boolean(warmupUrl)}
        onClick={onCopyWarmupLink}
      />
    );
  } else if (roomState === "reflection") {
    toolbarSlots[TOOLBAR_SLOT.secondaryAction] = (
      <Button
        ref={reflectionCardsShelfButtonRef}
        className="relative flex size-full flex-col items-center justify-center gap-4 border-2 border-primary border-dashed bg-background text-foreground"
        aria-label="Otwórz wrzutki"
        onClick={() => setIsReflectionCardsShelfOpen(true)}
      >
        Wrzutki
        {hasReflectionCards && (
          <div className="absolute bottom-1 left-4 right-4 h-2 animate-pulse rounded-full bg-destructive" />
        )}
      </Button>
    );
  } else if (isVotingVisible && isAdmin) {
    toolbarSlots[TOOLBAR_SLOT.secondaryAction] = (
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

  toolbarSlots[TOOLBAR_SLOT.ready] = (
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

  if (isVotingVisible) {
    toolbarSlots[TOOLBAR_SLOT.summary] = (
      <div className="flex size-full items-center justify-center rounded bg-background text-center wrap-break-word">
        {`${userVotes}/${maxVotes}`}
        <br />
        {pluralText(maxVotes, {
          one: "głos",
          few: "głosy",
          other: "głosów",
        })}
      </div>
    );
  }

  if (isWarmup) {
    if (isAdmin && warmup?.status === "revealed") {
      toolbarSlots[TOOLBAR_SLOT.navigation] = (
        <WarmupToolbarActions action="complete" onClick={completeWarmup} />
      );
    }
  } else if (isAdmin) {
    toolbarSlots[TOOLBAR_SLOT.navigation] = (
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

  if (isAdmin) {
    toolbarSlots[TOOLBAR_SLOT.finish] = (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="destructive"
              className="size-full"
              aria-label="Zakończ retrospektywę"
              onClick={onFinishRetroPress}
            />
          }
        >
          <FlagIcon className="size-6" />
        </TooltipTrigger>
        <TooltipContent>Zakończ retrospektywę</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={
        "z-30 flex flex-row gap-2 px-2 fixed bottom-0 left-0 right-0 pointer-events-none"
      }
    >
      <ToolboxSlotMachine />

      {isReflectionCardsShelfOpen && (
        <ReflectionCardsShelf
          teamId={teamId}
          onCardDrop={onCardDrop}
          enableDrag
          onDismiss={() => setIsReflectionCardsShelfOpen(false)}
        />
      )}

      <TooltipProvider delay={700}>
        <div className="relative mx-auto grid h-[80px] w-full max-w-3xl grid-cols-7 gap-2 rounded-t-2xl border border-b-0 border-border bg-card p-2 shadow-lg pointer-events-auto">
          {toolbarSlotKeys.map((slotKey, index) => {
            if (
              isWarmup &&
              isAdmin &&
              isWarmupDrawAction &&
              index === TOOLBAR_SLOT.roomAction
            ) {
              return null;
            }

            return (
              <div
                className="relative h-16 min-w-0"
                key={slotKey}
                style={{
                  gridColumn: `${index + 1} / span ${
                    isWarmupDrawAction && index === TOOLBAR_SLOT.leading ? 2 : 1
                  }`,
                }}
              >
                {toolbarSlots[index]}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};
