import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { cn } from "../../../common/Util";

const Card: React.FC<{ className?: string; id: string; columnId: string }> = ({
  className,
  id,
  columnId,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    return draggable({
      element: element,
      getInitialData: () => ({ id, columnId }),
    });
  }, []);

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={id}
      className={cn(
        "flex flex-col gap-2 w-full h-12 bg-white border rounded-lg cursor-grab transition-colors",
        className,
      )}
    />
  );
};

const Column: React.FC<{
  children: React.ReactNode;
  columnId: string;
  title: string;
  onCardDrop: (cardId: string) => void;
}> = ({ children, columnId, title, onCardDrop }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    return dropTargetForElements({
      element: element,
      canDrop: ({ source }) => {
        return (
          source.data.id !== undefined && source.data.columnId !== columnId
        );
      },
      onDrop: ({ source }) => {
        onCardDrop(source.data.id as string);
      },
    });
  }, []);

  return (
    <div className={"flex grow flex-col gap-2 w-1/3"}>
      <div
        className={
          "flex justify-center items-center w-full h-8 bg-background-50 border rounded-lg"
        }
      >
        {title}
      </div>

      <div
        ref={ref}
        className={"flex flex-col gap-2 h-full bg-secondary-400 rounded-lg"}
      >
        {children}
      </div>
    </div>
  );
};

const initialCards: { id: string; column: "todo" | "wip" | "done" }[] = [
  { id: "1", column: "todo" },
  { id: "2", column: "wip" },
  { id: "3", column: "wip" },
  { id: "4", column: "done" },
  { id: "5", column: "done" },
  { id: "6", column: "done" },
];

export const KanbanBoard: React.FC = () => {
  useEffect(() => {}, []);

  const [cards, setCards] = useState<typeof initialCards>(initialCards);

  const onCardDrop = (cardId: string, column: "todo" | "wip" | "done") => {
    setCards((cards) => [
      ...cards.filter((card) => card.id !== cardId),
      { id: cardId, column },
    ]);
  };

  return (
    <AnimatePresence>
      <div
        className={
          "w-full h-[400px] flex flex-row bg-secondary-500 rounded-2xl p-4 gap-4"
        }
      >
        <Column
          title={"To Do"}
          columnId={"todo"}
          onCardDrop={(id) => {
            onCardDrop(id, "todo");
          }}
        >
          {cards
            .filter((c) => c.column === "todo")
            .map((card) => (
              <Card key={card.id} id={card.id} columnId={"todo"} />
            ))}
        </Column>

        <Column
          title={"In Progress"}
          columnId={"wip"}
          onCardDrop={(id) => {
            onCardDrop(id, "wip");
          }}
        >
          {cards
            .filter((c) => c.column === "wip")
            .map((card) => (
              <Card key={card.id} id={card.id} columnId={"wip"} />
            ))}
        </Column>

        <Column
          title={"Done"}
          columnId={"done"}
          onCardDrop={(id) => {
            onCardDrop(id, "done");
          }}
        >
          {cards
            .filter((c) => c.column === "done")
            .map((card) => (
              <Card
                key={card.id}
                id={card.id}
                columnId={"done"}
                className={"bg-primary-500"}
              />
            ))}
        </Column>
      </div>
    </AnimatePresence>
  );
};
