import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { FilePlusIcon, TrashIcon } from "lucide-react";
import { motion } from "motion/react";
import React, { createRef, useEffect, useState } from "react";
import { Portal } from "react-portal";
import invariant from "tiny-invariant";
import cardDropSound from "@/assets/sounds/card-drop.wav";
import cardPickSound from "@/assets/sounds/card-pick.wav";
import {
  Card,
  CardActions,
  CardContent,
} from "@/components/molecules/card/Card";
import {
  getReflectionCard,
  isCard,
} from "@/components/molecules/dragndrop/dragndrop";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/hooks/useAudio";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import { useReflectionCardStore } from "@/store/useReflectionCardStore";

export const ReflectionCardsShelf: React.FC<{
  teamId: string;
  onCardDrop?: (cardId: string) => void;
  enableDrag?: boolean;
  onDismiss: () => void;
}> = ({ teamId, onCardDrop, enableDrag = false, onDismiss }) => {
  const drawerRef = createRef<HTMLDivElement>();

  const [isCreatingNewReflectionCard, setIsCreatingNewReflectionCard] =
    useState(false);
  const [newReflectionCardText, setNewReflectionCardText] = useState("");

  const [isOverDropDiv, setIsOverDropDiv] = useState(false);

  const {
    deleteReflectionCard,
    editReflectionCard,
    addReflectionCard,
    reflectionCards,
  } = useReflectionCardStore();

  useEffect(() => {
    const drawerElement = drawerRef.current;

    invariant(drawerElement);

    return combine(
      dropTargetForElements({
        element: drawerElement,
        canDrop: ({ source }) => isCard(source.data),
        onDrop: ({ source }) => {
          if (isCard(source.data)) {
            setIsOverDropDiv(false);
            onCardDrop?.(source.data.cardId);
          }
        },
        onDrag: () => setIsOverDropDiv(true),
        onDragLeave: () => closeDrawer(),
      }),
    );
  }, [onCardDrop]);

  useClickOutside(drawerRef, () => {
    closeDrawer();
  });

  const closeDrawer = () => {
    onDismiss();
    setIsOverDropDiv(false);
  };

  const onReflectionCardDeleteClick = (reflectionCardId: string) => {
    deleteReflectionCard(teamId, reflectionCardId).then();
  };

  const onReflectionCardEdit = (reflectionCardId: string, newText: string) => {
    editReflectionCard(reflectionCardId, teamId, newText).then();
  };

  const onNewReflectionCardClick = () => {
    setIsCreatingNewReflectionCard(true);
  };

  const onSaveNewReflectionCardClick = (text: string) => {
    const trimmedText = text.trim();

    if (trimmedText === "") {
      return;
    }

    setIsCreatingNewReflectionCard(false);
    setNewReflectionCardText("");
    addReflectionCard(teamId, trimmedText);
  };

  const onDeleteNewReflectionCardClick = () => {
    setIsCreatingNewReflectionCard(false);
    setNewReflectionCardText("");
  };

  return (
    <Portal>
      <div
        ref={drawerRef}
        className={cn("absolute bottom-0 min-h-52 w-full z-10 overflow-hidden")}
      >
        <motion.div
          initial={{ bottom: -150 }}
          animate={{ bottom: 0 }}
          className={cn(
            "absolute bottom-0 h-full w-full p-2 bg-secondary rounded-t-lg flex flex-col gap-2",
            isOverDropDiv
              ? "border-2 border-b-0 border-primary"
              : "border-2 border-transparent",
          )}
        >
          <div className={"flex justify-between"}>
            <span
              className={
                "font-harlow-solid-italic text-3xl text-secondary-foreground"
              }
            >
              Wrzutki
            </span>

            <Button onClick={onNewReflectionCardClick} size={"sm"}>
              Nowa wrzutka
              <FilePlusIcon className={"size-4"} />
            </Button>
          </div>

          <div
            className={
              "flex flex-row gap-2 h-full w-full p-2 overflow-x-scroll"
            }
          >
            {reflectionCards.length === 0 && !isCreatingNewReflectionCard && (
              <div
                className={
                  "flex justify-center items-center h-full w-full border-2 border-dashed rounded-xl text-center"
                }
              >
                Stwórz nową wrzutkę lub przeciągnij tu istniejącą kartę aby
                zapisać ją na później!
              </div>
            )}

            {(reflectionCards.length !== 0 || isCreatingNewReflectionCard) && (
              <div className={cn("flex flex-row gap-2 h-full w-full rounded")}>
                {isCreatingNewReflectionCard && (
                  <Card
                    id="new-reflection-card"
                    onEditDismiss={onDeleteNewReflectionCardClick}
                    positioningBackgroundEnabled={false}
                  >
                    <CardContent
                      text={newReflectionCardText}
                      editable
                      autoFocus
                      onSave={onSaveNewReflectionCardClick}
                      onEditDismiss={onDeleteNewReflectionCardClick}
                    />
                    <CardActions>
                      <Button
                        onClick={onDeleteNewReflectionCardClick}
                        size={"icon"}
                        variant={"destructive"}
                      >
                        <TrashIcon className={"size-4"} />
                      </Button>
                    </CardActions>
                  </Card>
                )}

                {reflectionCards.map((card) => {
                  return (
                    <DraggableReflectionCard
                      key={card.id}
                      id={card.id}
                      text={card.text}
                      enableDrag={enableDrag}
                      onEdit={(newText) => {
                        onReflectionCardEdit(card.id, newText);
                      }}
                      onDeleteClick={() => {
                        onReflectionCardDeleteClick(card.id);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Portal>
  );
};

const DraggableReflectionCard: React.FC<{
  id: string;
  text: string;
  onEdit: (newText: string) => void;
  onDeleteClick: () => void;
  enableDrag?: boolean;
}> = ({ id, text, onEdit, onDeleteClick, enableDrag = false }) => {
  const cardRef = createRef<HTMLDivElement>();
  const { play: playSound } = useAudio();

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!enableDrag) {
      return;
    }

    const element = cardRef.current;
    invariant(element);

    return combine(
      draggable({
        element: element,
        getInitialData: () => getReflectionCard({ reflectionCardId: id }),
        onDragStart: () => {
          playSound(cardPickSound).then();
          setIsDragging(true);
        },
        onDrop: () => {
          playSound(cardDropSound).then();
          setIsDragging(false);
        },
      }),
    );
  }, [id]);

  return (
    <motion.div
      layout
      layoutId={`${id}-draggable`}
      ref={cardRef}
      className={cn(
        enableDrag && "cursor-grab",
        isDragging ? "opacity-25" : "opacity-100",
      )}
    >
      <Card id={id} positioningBackgroundEnabled={false}>
        <CardContent text={text} editable onSave={onEdit} />
        <CardActions>
          <Button onClick={onDeleteClick} size={"icon"} variant={"destructive"}>
            <TrashIcon className={"size-4"} />
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};
