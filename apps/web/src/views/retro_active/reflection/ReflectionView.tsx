import { TrashIcon } from "lucide-react";
import type React from "react";
import { Button } from "@/components/atoms/button/Button";
import { Card } from "@/components/molecules/card/Card";
import { Column } from "@/components/molecules/column/Column";
import { ColumnInput } from "@/components/molecules/column/ColumnInput";
import { ColumnCards } from "@/components/molecules/dragndrop/ColumnCards";
import { DraggableCard } from "@/components/molecules/dragndrop/DraggableCard";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useReflectionCardStore } from "@/store/useReflectionCardStore";

export const ReflectionView: React.FC = () => {
  const { user } = useUser();
  const {
    teamUsers,
    teamId,
    columns,
    cards,
    moveCard,
    setWriting,
    createCard,
    updateCard,
    deleteCard,
  } = useRetro();
  const { deleteReflectionCard } = useReflectionCardStore();

  const onReflectionCardDrop = (
    reflectionCardId: string,
    text: string,
    columnId: string,
  ) => {
    if (!teamId) {
      return;
    }

    deleteReflectionCard(teamId, reflectionCardId).then(() => {
      createCard(text, columnId);
    });
  };

  return (
    <div
      className={
        "grid grid-flow-col [grid-auto-columns:minmax(300px,1fr)] h-full"
      }
    >
      {columns?.map((column) => {
        const columnCards = cards.filter((c) => c.columnId === column.id);

        return (
          <Column
            key={column.id}
            columnData={{
              color: column.color,
              name: column.name,
              description: column.description,
            }}
          >
            <ColumnInput
              columnData={column}
              onCardCreated={(value) => {
                createCard(value, column.id);
              }}
              onIsWriting={(value) => {
                setWriting(value, column.id);
              }}
            />

            <ColumnCards
              columnId={column.id}
              onReflectionCardDropped={({ id, text }) => {
                onReflectionCardDrop(id, text, column.id);
              }}
              onCardDropped={moveCard}
            >
              {columnCards
                ?.filter((card) => card.authorId === user?.id)
                .map((card) => {
                  const user = teamUsers.find(
                    (user) => user.id === card.authorId,
                  );

                  return (
                    <DraggableCard
                      key={card.id}
                      parentCardId={card.parentCardId}
                      cardId={card.id}
                      columnId={column.id}
                      changeOpacityOnDrag
                    >
                      <Card
                        id={card.id}
                        key={card.id}
                        text={card.text}
                        editableText
                        author={{
                          avatar: user?.avatar_link || "",
                          name: user?.nick || "",
                          id: card.authorId,
                        }}
                        teamUsers={teamUsers.map((user) => ({
                          id: user.id,
                          name: user.nick,
                          avatar: user.avatar_link,
                        }))}
                        onUpdate={(_, text) => updateCard(card.id, text)}
                      >
                        <Button
                          size={"icon"}
                          variant={"destructive"}
                          onClick={() => deleteCard(card.id)}
                        >
                          <TrashIcon className={"size-4"} />
                        </Button>
                      </Card>
                    </DraggableCard>
                  );
                })}
            </ColumnCards>
          </Column>
        );
      })}
    </div>
  );
};
