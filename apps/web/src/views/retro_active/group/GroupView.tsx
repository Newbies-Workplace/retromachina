import React from "react";
import { cn } from "../../../common/Util";
import { Card } from "../../../component/molecules/card/Card";
import { Column } from "../../../component/molecules/column/Column";
import { ColumnCardContainer } from "../../../component/molecules/dragndrop/ColumnCardContainer";
import { DraggableCard } from "../../../component/molecules/dragndrop/DraggableCard";
import { GroupCardContainer } from "../../../component/molecules/dragndrop/group_card_container/GroupCardContainer";
import { useRetro } from "../../../context/retro/RetroContext.hook";
import { useDebounce } from "../../../context/useDebounce";
import { SLOT_MACHINE_ANIMATION_DURATION } from "../components/toolbox/SlotMachine";

export const GroupView: React.FC = () => {
  const {
    teamUsers,
    columns,
    cards,
    moveCard,
    slotMachineVisible,
    highlightedUserId,
  } = useRetro();
  const delayedHighlightedUserId = useDebounce(
    highlightedUserId,
    SLOT_MACHINE_ANIMATION_DURATION,
  );

  return (
    <div
      className={cn(
        "grid grid-flow-col [grid-auto-columns:minmax(300px,1fr)] h-full scrollbar",
        slotMachineVisible && "pb-28",
      )}
    >
      {columns.map((column) => {
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
            <ColumnCardContainer
              columnId={column.id}
              onCardDropped={(cardId) =>
                moveCard({
                  targetType: "column",
                  cardId: cardId,
                  targetId: column.id,
                })
              }
            >
              {columnCards
                .filter((c) => c.parentCardId === null)
                .sort((a, b) => {
                  if (!slotMachineVisible || a.authorId === b.authorId) {
                    return 0;
                  }

                  if (a.authorId === delayedHighlightedUserId) {
                    return -1;
                  }

                  if (b.authorId === delayedHighlightedUserId) {
                    return 1;
                  }

                  return 0;
                })
                .map((group) => {
                  const groupCards = [
                    group,
                    ...cards.filter((c) => c.parentCardId === group.id),
                  ];

                  return (
                    <GroupCardContainer
                      key={group.id}
                      parentCardId={group.id}
                      className={cn(
                        "transition-opacity",
                        slotMachineVisible &&
                          delayedHighlightedUserId !== null &&
                          delayedHighlightedUserId !== group.authorId &&
                          "opacity-30",
                      )}
                      onCardDropped={(cardId) =>
                        moveCard({
                          targetType: "card",
                          cardId: cardId,
                          targetId: group.id,
                        })
                      }
                    >
                      {groupCards.map((card, index) => {
                        const user = teamUsers.find(
                          (user) => user.id === card.authorId,
                        );

                        return (
                          <DraggableCard
                            key={card.id}
                            parentCardId={card.parentCardId}
                            cardId={card.id}
                            columnId={column.id}
                            style={{ marginTop: index === 0 ? 0 : -80 }}
                          >
                            <Card
                              id={card.id}
                              text={card.text}
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
                            />
                          </DraggableCard>
                        );
                      })}
                    </GroupCardContainer>
                  );
                })}
            </ColumnCardContainer>
          </Column>
        );
      })}
    </div>
  );
};
