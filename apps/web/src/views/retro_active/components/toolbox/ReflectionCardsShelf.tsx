import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { TrashIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import React, { createRef, useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { cn } from "../../../../common/Util";
import { Button } from "../../../../component/atoms/button/Button";
import {
  getReflectionCard,
  isCard,
} from "../../../../component/molecules/dragndrop/dragndrop";
import useClickOutside from "../../../../context/useClickOutside";

export const ReflectionCardsShelf: React.FC = () => {
  const ref = createRef<HTMLButtonElement>();
  const drawerRef = createRef<HTMLDivElement>();

  const [isOverDropDiv, setIsOverDropDiv] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [cards, setCards] = useState([
    "testowa kartka na potem1 testowa kartka na potem1 testowa kartka na potem1 testowa kartka na potem1 testowa kartka na potem1 testowa kartka na potem1 testowa kartka na potem1",
    "testowa kartka na potem2",
  ]);

  useEffect(() => {
    const buttonElement = ref.current;
    const drawerElement = drawerRef.current;
    invariant(buttonElement);
    invariant(drawerElement);

    return combine(
      dropTargetForElements({
        element: buttonElement,
        canDrop: ({ source }) => isCard(source.data),
        onDrag: () => {
          setIsOverDropDiv(true);
          setIsOpen(true);
        },
      }),
      dropTargetForElements({
        element: drawerElement,
        canDrop: ({ source }) => isCard(source.data),
        onDrop: () => closeDrawer(),
        onDrag: () => setIsOverDropDiv(true),
        onDragLeave: () => closeDrawer(),
      }),
    );
  }, []);

  useClickOutside(drawerRef, () => {
    closeDrawer();
  });

  const closeDrawer = () => {
    setIsOpen(false);
    setIsOverDropDiv(false);
  };

  const onDrawerOpenClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div
        ref={drawerRef}
        className={cn(
          "absolute bottom-0 h-48 w-full z-10 overflow-hidden",
          isOpen ? "visible" : "invisible",
        )}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ bottom: -150 }}
              animate={{ bottom: 0 }}
              exit={{ bottom: -150 }}
              className={cn(
                "absolute bottom-0 h-full w-full p-2 bg-secondary-500 rounded-t-lg flex flex-col gap-2",
                isOverDropDiv
                  ? "border-2 border-b-0 border-primary-500"
                  : "border-2 border-transparent",
              )}
            >
              <div className={"flex justify-between text-background-50"}>
                <span className={"font-harlow-solid-italic text-3xl"}>
                  Wrzutki
                </span>

                <span>Przeciągnij tematy aby zachować je na później!</span>
              </div>

              <div
                className={cn(
                  "flex flex-row gap-2 h-full w-full scrollbar rounded",
                  cards.length === 0 &&
                    "border-2 border-dashed border-background-50",
                )}
              >
                {cards.map((card) => {
                  return (
                    <ReflectionCard
                      key={card}
                      id={card}
                      text={card}
                      onDeleteClick={() => {}}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button
        ref={ref}
        className={cn(
          "flex flex-col justify-center items-center gap-4 w-24 h-16 bg-white border-2 border-primary-500 border-dashed",
        )}
        onClick={onDrawerOpenClick}
      >
        Wrzutki
      </Button>
    </>
  );
};

const ReflectionCard: React.FC<{
  id: string;
  text: string;
  onDeleteClick: () => void;
}> = ({ id, text, onDeleteClick }) => {
  const cardRef = createRef<HTMLDivElement>();

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
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
    <div
      ref={cardRef}
      className={cn(
        "flex justify-center items-start gap-1 h-full w-52 min-w-52 p-2 bg-white cursor-grab rounded-md border border-black",
        isDragging ? "opacity-25" : "opacity-100",
      )}
    >
      <span className={"h-full scrollbar"}>{text}</span>

      <div>
        <Button onClick={() => {}} size={"icon"} variant={"destructive"}>
          <TrashIcon className={"size-6"} />
        </Button>
      </div>
    </div>
  );
};
