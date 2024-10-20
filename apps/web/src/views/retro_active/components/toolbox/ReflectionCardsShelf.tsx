import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { FilePlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import React, { createRef, useEffect, useState } from "react";
import { Portal } from "react-portal";
import invariant from "tiny-invariant";
import SaveIcon from "../../../../assets/icons/save.svg";
import { cn } from "../../../../common/Util";
import { Button } from "../../../../component/atoms/button/Button";
import {
  getReflectionCard,
  isCard,
} from "../../../../component/molecules/dragndrop/dragndrop";
import useClickOutside from "../../../../context/useClickOutside";
import { useReflectionCardStore } from "../../../../store/useReflectionCardStore";

export const ReflectionCardsShelf: React.FC<{
  teamId: string;
  onCardDrop?: (cardId: string) => void;
  enableDrag?: boolean;
  onDismiss: () => void;
}> = ({ teamId, onCardDrop, enableDrag = false, onDismiss }) => {
  const drawerRef = createRef<HTMLDivElement>();
  const newCardInputRef = createRef<HTMLTextAreaElement>();

  const [isCreatingNewReflectionCard, setIsCreatingNewReflectionCard] =
    useState(false);
  const [newReflectionCardText, setNewReflectionCardText] = useState("");

  const [isOverDropDiv, setIsOverDropDiv] = useState(false);

  const { deleteReflectionCard, addReflectionCard, reflectionCards } =
    useReflectionCardStore();

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

  useEffect(() => {
    if (isCreatingNewReflectionCard) {
      newCardInputRef.current?.focus();
    }
  }, [isCreatingNewReflectionCard]);

  const closeDrawer = () => {
    onDismiss();
    setIsOverDropDiv(false);
  };

  const onReflectionCardDeleteClick = (reflectionCardId: string) => {
    deleteReflectionCard(teamId, reflectionCardId).then();
  };

  const onNewReflectionCardClick = () => {
    setIsCreatingNewReflectionCard(true);
  };

  const onSaveNewReflectionCardClick = () => {
    const trimmedText = newReflectionCardText.trim();

    if (trimmedText === "") {
      return;
    }

    setIsCreatingNewReflectionCard(false);
    addReflectionCard(teamId, trimmedText).then(() => {
      setNewReflectionCardText("");
    });
  };

  const onDeleteNewReflectionCardClick = () => {
    setIsCreatingNewReflectionCard(false);
    setNewReflectionCardText("");
  };

  return (
    <Portal>
      <div
        ref={drawerRef}
        className={cn("absolute bottom-0 h-48 w-full z-10 overflow-hidden")}
      >
        <motion.div
          initial={{ bottom: -150 }}
          animate={{ bottom: 0 }}
          className={cn(
            "absolute bottom-0 h-full w-full p-2 bg-secondary-500 rounded-t-lg flex flex-col gap-2",
            isOverDropDiv
              ? "border-2 border-b-0 border-primary-500"
              : "border-2 border-transparent",
          )}
        >
          <div className={"flex justify-between text-background-50"}>
            <span className={"font-harlow-solid-italic text-3xl"}>Wrzutki</span>

            <Button onClick={onNewReflectionCardClick} size={"sm"}>
              Nowa wrzutka
              <FilePlusIcon className={"size-4"} />
            </Button>
          </div>

          {reflectionCards.length === 0 && !isCreatingNewReflectionCard && (
            <div
              className={
                "flex justify-center items-center h-full border-2 border-dashed border-background-50 text-background-50 text-center"
              }
            >
              Stwórz nową wrzutkę lub przeciągnij tu istniejącą kartę aby
              zapisać ją na później!
            </div>
          )}

          {(reflectionCards.length !== 0 || isCreatingNewReflectionCard) && (
            <div
              className={cn(
                "flex flex-row gap-2 h-full w-full scrollbar rounded",
              )}
            >
              {isCreatingNewReflectionCard && (
                <div
                  className={
                    "flex flex-row gap-2 min-w-52 w-52 h-full p-2 bg-gray-500 rounded-md border border-black"
                  }
                >
                  <textarea
                    ref={newCardInputRef}
                    className={
                      "w-full h-full bg-gray-500 scrollbar active:outline-none focus:outline-none"
                    }
                    value={newReflectionCardText}
                    onChange={(e) => setNewReflectionCardText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSaveNewReflectionCardClick();
                      }
                    }}
                  />

                  <div className={"flex flex-col gap-2"}>
                    <Button
                      onClick={onSaveNewReflectionCardClick}
                      size={"icon"}
                    >
                      <SaveIcon width={18} height={18} />
                    </Button>

                    <Button
                      onClick={onDeleteNewReflectionCardClick}
                      size={"icon"}
                      variant={"destructive"}
                    >
                      <TrashIcon className={"size-6"} />
                    </Button>
                  </div>
                </div>
              )}

              {reflectionCards.map((card) => {
                return (
                  <ReflectionCard
                    key={card.id}
                    id={card.id}
                    text={card.text}
                    enableDrag={enableDrag}
                    onDeleteClick={() => {
                      onReflectionCardDeleteClick(card.id);
                    }}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </Portal>
  );
};

const ReflectionCard: React.FC<{
  id: string;
  text: string;
  onDeleteClick: () => void;
  enableDrag?: boolean;
}> = ({ id, text, onDeleteClick, enableDrag = false }) => {
  const cardRef = createRef<HTMLDivElement>();

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
        getInitialData: () => getReflectionCard({ reflectionCardId: id, text }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
    );
  }, []);

  return (
    <motion.div
      layout
      layoutId={id}
      ref={cardRef}
      className={cn(
        "flex justify-center items-start gap-1 h-full w-52 min-w-52 p-2 bg-white rounded-md border border-black",
        enableDrag && "cursor-grab",
        isDragging ? "opacity-25" : "opacity-100",
      )}
    >
      <span
        className={"word-break whitespace-pre-line w-full h-full scrollbar"}
      >
        {text}
      </span>

      <div>
        <Button onClick={onDeleteClick} size={"icon"} variant={"destructive"}>
          <TrashIcon className={"size-6"} />
        </Button>
      </div>
    </motion.div>
  );
};
