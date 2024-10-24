import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  CheckIcon,
  ThickArrowLeftIcon,
  ThickArrowRightIcon,
} from "@radix-ui/react-icons";
import ProgressBar from "@ramonak/react-progress-bar";
import React, { createRef, useEffect } from "react";
import { useCallback, useRef, useState } from "react";
import invariant from "tiny-invariant";
import CheckeredFlagIconSvg from "../../../../assets/icons/finish-flag.svg";
import SlotMachineIcon from "../../../../assets/icons/slot-machine-icon.svg";
import VoteIconSvg from "../../../../assets/icons/vote.svg";
import { cn } from "../../../../common/Util";
import { Button } from "../../../../component/atoms/button/Button";
import { isCard } from "../../../../component/molecules/dragndrop/dragndrop";
import { useConfirm } from "../../../../context/confirm/ConfirmContext.hook";
import { useRetro } from "../../../../context/retro/RetroContext.hook";
import { useCardGroups } from "../../../../context/useCardGroups";
import useClickOutside from "../../../../context/useClickOutside";
import { usePlural } from "../../../../context/usePlural";
import { useTeamRole } from "../../../../context/useTeamRole";
import { useUser } from "../../../../context/user/UserContext.hook";
import { useReflectionCardStore } from "../../../../store/useReflectionCardStore";
import { ReflectionCardsShelf } from "./ReflectionCardsShelf";
import { SlotMachine } from "./SlotMachine";

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
    activeUsers,
    endRetro,
    slotMachineVisible,
    setSlotMachineVisible,
    deleteCard,
  } = useRetro();

  const { isAdmin } = useTeamRole(teamId!);
  const { addReflectionCard, fetchReflectionCards } = useReflectionCardStore();
  const hasReflectionCards = useReflectionCardStore(
    (state) => state.reflectionCards.length > 0,
  );

  const { user } = useUser();
  const userVotes =
    maxVotes - votes.filter((vote) => user?.id === vote.voterId).length;
  const groups = useCardGroups(cards, votes).sort((a, b) => b.votes - a.votes);
  const currentIndex = groups.findIndex(
    (g) => g.parentCardId === discussionCardId,
  );
  const targetIndex = currentIndex + 1;
  const nextDisabled =
    (roomState === "discuss" && targetIndex >= groups.length) ||
    cards.length <= 0;
  const prevDisabled = roomState === "reflection";
  const isVotingVisible = roomState === "vote";

  const [isVoteOpen, setOpenVote] = useState(false);

  const votePopover = useRef<any>();
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

  const onCardDrop = async (cardId: string) => {
    const card = cards.find((card) => card.id === cardId);

    if (!card) {
      return;
    }

    addReflectionCard(teamId, card.text).then(() => {
      deleteCard(cardId);
    });
  };

  return (
    <div className={"flex flex-row gap-2 mx-2"}>
      <SlotMachine />

      {isReflectionCardsShelfOpen && (
        <ReflectionCardsShelf
          teamId={teamId}
          onCardDrop={onCardDrop}
          enableDrag
          onDismiss={() => setIsReflectionCardsShelfOpen(false)}
        />
      )}

      <div
        className={
          "relative flex items-center justify-center gap-2 w-full p-2 bg-background-500 rounded-t-2xl"
        }
      >
        {isAdmin && <div className={"flex justify-center gap-2 w-24 h-16"} />}
        {isAdmin && roomState !== "reflection" && roomState !== "group" && (
          <div className={"flex justify-center gap-2 w-24 h-16"} />
        )}

        {isAdmin && roomState === "group" && (
          <div className={"flex justify-center gap-2 w-24 h-16"}>
            <Button
              className={"w-full h-full"}
              disabled={activeUsers.length < 2}
              onClick={() => setSlotMachineVisible(!slotMachineVisible)}
            >
              <SlotMachineIcon className={"size-7"} />
            </Button>
          </div>
        )}

        {roomState === "reflection" && (
          <div className={"relative w-24 h-16 group"}>
            <Button
              ref={reflectionCardsShelfButtonRef}
              className={cn(
                "relative flex flex-col justify-center items-center gap-4 size-full bg-white border-2 border-primary-500 border-dashed",
              )}
              onClick={() => {
                setIsReflectionCardsShelfOpen(true);
              }}
            >
              Wrzutki
              {hasReflectionCards && (
                <div
                  className={
                    "absolute size-4 rounded-full bg-red-500 w-20 h-2 bottom-1 animate-pulse "
                  }
                />
              )}
            </Button>
          </div>
        )}

        <div className={"flex justify-center gap-2 w-24 h-16"}>
          {isVotingVisible && isAdmin && (
            <>
              <Button className={"size-full"} onClick={() => setOpenVote(true)}>
                <VoteIconSvg />
              </Button>

              {isVoteOpen && (
                <div
                  className={
                    "flex flex-col absolute bottom-[86px] bg-background-500 rounded-xl p-2 shadow-md"
                  }
                  ref={votePopover}
                >
                  <div className={"text-sm text-center"}>
                    {usePlural(maxVotes, {
                      one: "głos",
                      few: "głosy",
                      other: "głosów",
                    })}{" "}
                    na osobę
                  </div>

                  <div
                    className={
                      "flex justify-between gap-2 h-[30px] w-full pt-1 bg-background-500"
                    }
                  >
                    <Button
                      className={"size-full"}
                      size={"sm"}
                      onClick={() =>
                        maxVotes > 0 && setMaxVotesAmount(maxVotes - 1)
                      }
                    >
                      -
                    </Button>
                    <div
                      className={
                        "flex justify-center items-center bg-background-50 h-[30px] min-w-[50px] rounded"
                      }
                    >
                      {maxVotes}
                    </div>
                    <Button
                      className={"size-full"}
                      size={"sm"}
                      onClick={() => setMaxVotesAmount(maxVotes + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={cn("flex flex-col justify-center gap-2 w-24 h-16")}>
          <Button
            className={cn("h-full w-full")}
            onClick={() => setReady(!ready)}
          >
            <CheckIcon className={"size-8"} />
          </Button>

          <ProgressBar
            completed={readyPercentage}
            maxCompleted={100}
            bgColor="#73bda8"
            transitionDuration={"0.4s"}
            isLabelVisible={false}
            labelColor="#e80909"
            height="10px"
            baseBgColor="#F4F2E6"
          />
        </div>

        <div className={"flex justify-center gap-2 w-24 h-16"}>
          {isVotingVisible && (
            <div
              className={
                "flex justify-center items-center relative w-full h-full rounded bg-background-50 text-center break-words"
              }
            >
              {`${userVotes}/${maxVotes}`}
              <br />
              {usePlural(maxVotes, {
                one: "głos",
                few: "głosy",
                other: "głosów",
              })}
            </div>
          )}
        </div>

        {!isAdmin && roomState === "reflection" && (
          <div className={"flex justify-center gap-2 w-24 h-16"} />
        )}

        {isAdmin && (
          <div
            className={"flex justify-between gap-2 w-24 h-16 *:w-[60px] *:p-0"}
          >
            <Button
              className={"size-full"}
              disabled={prevDisabled}
              onClick={prevRoomState}
            >
              <ThickArrowLeftIcon className={"size-6"} />
            </Button>

            <Button
              className={"size-full"}
              disabled={nextDisabled}
              onClick={nextRoomState}
            >
              <ThickArrowRightIcon className={"size-6"} />
            </Button>
          </div>
        )}

        <div className={"flex justify-center gap-2 w-24 h-16"}>
          {isAdmin && (
            <>
              <Button
                variant={"destructive"}
                className={"size-full"}
                onClick={onFinishRetroPress}
              >
                <CheckeredFlagIconSvg style={{ width: 32, height: 32 }} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
