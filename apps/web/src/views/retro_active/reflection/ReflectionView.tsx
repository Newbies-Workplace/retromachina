import { TrashIcon } from "@radix-ui/react-icons";
import type React from "react";
import { Button } from "../../../component/atoms/button/Button";
import { Card } from "../../../component/molecules/card/Card";
import { Column } from "../../../component/molecules/column/Column";
import { ColumnInput } from "../../../component/molecules/column/ColumnInput";
import { useRetro } from "../../../context/retro/RetroContext.hook";
import { useUser } from "../../../context/user/UserContext.hook";

export const ReflectionView: React.FC = () => {
  const { user } = useUser();
  const {
    teamUsers,
    columns,
    cards,
    setWriting,
    createCard,
    updateCard,
    deleteCard,
  } = useRetro();

  return (
    <div
      className={
        "grid grid-flow-col [grid-auto-columns:minmax(0,1fr)] h-full scrollbar"
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

            {columnCards
              ?.filter((card) => card.authorId === user?.id)
              .map((card) => {
                const user = teamUsers.find(
                  (user) => user.id === card.authorId,
                );

                return (
                  <Card
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
                      <TrashIcon className={"size-6"} />
                    </Button>
                  </Card>
                );
              })}
          </Column>
        );
      })}
    </div>
  );
};
