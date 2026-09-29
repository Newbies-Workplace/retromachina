import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { FlagIcon } from "lucide-react";
import React, { type ReactNode, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import SlotMachineIcon from "@/assets/icons/slot-machine-icon.svg";
import { isCard } from "@/components/molecules/dragndrop/dragndrop";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfirm } from "@/context/confirm/ConfirmContext.hook";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useTeamRole } from "@/hooks/useTeamRole";
import { groupCards } from "@/lib/groupCards";
import { pluralText } from "@/lib/pluralText";
import { useReflectionCardStore } from "@/store/useReflectionCardStore";
import { ReflectionCardsShelf } from "@/views/retro_active/components/toolbox/ReflectionCardsShelf";
import { ToolboxSlotMachine } from "@/views/retro_active/components/toolbox/ToolboxSlotMachine";
import { WarmupToolbarActions } from "@/views/retro_active/components/toolbox/WarmupToolbarActions";
import {
  ToolboxNavigation,
  ToolboxReadyControl,
  ToolboxSecondaryAction,
} from "./ToolboxControls";

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

function getWarmupToolbarState(
  warmup: ReturnType<typeof useRetro>["warmup"],
  isWarmup: boolean,
  isAdmin: boolean,
) {
  const isWarmupDrawAction =
    isWarmup &&
    isAdmin &&
    (warmup?.status === "pending" || warmup?.status === "revealed");
  const selectedWarmup =
    warmup?.result ??
    warmup?.candidates.find(
      (candidate) => candidate.id === warmup?.selectedWarmupId,
    );
  const shouldWaitForRoomCreation = selectedWarmup
    ? (selectedWarmup.shouldWaitForRoomCreation ??
      selectedWarmup.id !== "default-giphy")
    : true;
  const warmupUrl = selectedWarmup
    ? shouldWaitForRoomCreation
      ? warmup?.status === "revealed"
        ? (warmup.sharedRoomUrl ?? undefined)
        : undefined
      : selectedWarmup.url
    : undefined;
  return { isWarmupDrawAction, warmupUrl };
}

function isNextStageDisabled(
  cards: ReturnType<typeof useRetro>["cards"],
  votes: ReturnType<typeof useRetro>["votes"],
  discussionCardId: string | null,
  roomState: ReturnType<typeof useRetro>["roomState"],
) {
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
  return nextDisabled;
}

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

  const { isAdmin } = useTeamRole(teamId ?? "");
  const { addReflectionCard, fetchReflectionCards } = useReflectionCardStore();
  const hasReflectionCards = useReflectionCardStore(
    (state) => state.reflectionCards.length > 0,
  );

  const { user } = useUser();
  const userVotes =
    maxVotes - votes.filter((vote) => user?.id === vote.voterId).length;
  const nextDisabled = isNextStageDisabled(
    cards,
    votes,
    discussionCardId,
    roomState,
  );
  const prevDisabled = roomState === "reflection" && !warmup;
  const isVotingVisible = roomState === "vote";
  const isWarmup = roomState === "warmup";
  const { isWarmupDrawAction, warmupUrl } = getWarmupToolbarState(
    warmup,
    isWarmup,
    isAdmin,
  );

  const reflectionCardsShelfButtonRef = useRef<HTMLButtonElement>(null);
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

  const onOpenWarmupLink = () => {
    if (!warmupUrl) return;

    window.open(warmupUrl, "_blank", "noopener,noreferrer");
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

  if (isWarmupDrawAction) {
    toolbarSlots[TOOLBAR_SLOT.leading] = (
      <WarmupToolbarActions
        action={warmup?.status === "pending" ? "start" : "reroll"}
        onClick={startWarmupDraw}
      />
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

  toolbarSlots[TOOLBAR_SLOT.secondaryAction] = (
    <ToolboxSecondaryAction
      isWarmup={isWarmup}
      roomState={roomState}
      isAdmin={isAdmin}
      warmupUrl={warmupUrl}
      onOpenWarmupLink={onOpenWarmupLink}
      shelfButtonRef={reflectionCardsShelfButtonRef}
      onOpenShelf={() => setIsReflectionCardsShelfOpen(true)}
      hasReflectionCards={hasReflectionCards}
      maxVotes={maxVotes}
      setMaxVotesAmount={setMaxVotesAmount}
    />
  );

  toolbarSlots[TOOLBAR_SLOT.ready] = (
    <ToolboxReadyControl
      ready={ready}
      setReady={setReady}
      readyPercentage={readyPercentage}
    />
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

  toolbarSlots[TOOLBAR_SLOT.navigation] = (
    <ToolboxNavigation
      isAdmin={isAdmin}
      isWarmup={isWarmup}
      warmup={warmup}
      startWarmupDraw={startWarmupDraw}
      completeWarmup={completeWarmup}
      nextRoomState={nextRoomState}
      prevRoomState={prevRoomState}
      nextDisabled={nextDisabled}
      prevDisabled={prevDisabled}
    />
  );

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
            if (isWarmupDrawAction && index === TOOLBAR_SLOT.roomAction) {
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
