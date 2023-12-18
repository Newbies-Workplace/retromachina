import {useRetro} from "../../../context/retro/RetroContext.hook"
import {Column} from "../../../component/molecules/column/Column"
import React from "react";
import {Card} from "../../../component/molecules/card/Card";
import {ColumnCardContainer} from "../../../component/molecules/dragndrop/ColumnCardContainer";
import {DraggableCard} from "../../../component/molecules/dragndrop/DraggableCard";
import {GroupCardContainer} from "../../../component/molecules/dragndrop/group_card_container/GroupCardContainer";

export const GroupView: React.FC = () => {
    const {teamUsers, columns, cards, moveCard} = useRetro()

    return (
        <div style={{display: 'flex', flexDirection: 'row'}}>
            {columns?.map((column) => {
                const columnCards = cards.filter(c => c.columnId === column.id)

                return (
                    <Column
                        key={column.id}
                        columnData={{
                            color: column.color,
                            name: column.name,
                            description: column.description,
                        }}>
                        <ColumnCardContainer
                            columnId={column.id}
                            onCardDropped={(cardId) => moveCard({
                                targetType: 'column',
                                cardId: cardId,
                                targetId: column.id
                            })}>
                            {columnCards.filter(c => c.parentCardId === null).map(group => {
                                const groupCards = [group, ...cards.filter(c => c.parentCardId === group.id)]
                                return (
                                    <GroupCardContainer
                                        key={group.id}
                                        parentCardId={group.id}
                                        onCardDropped={(cardId) => moveCard({
                                            targetType: 'card',
                                            cardId: cardId,
                                            targetId: group.id,
                                        })}>
                                        {groupCards.map((card, index) => {
                                            const user = teamUsers.find((user) => user.id === card.authorId);

                                            return (
                                                <DraggableCard
                                                    key={card.id}
                                                    parentCardId={card.parentCardId}
                                                    cardId={card.id}
                                                    columnId={column.id}
                                                    style={{marginTop: index === 0 ? 0 : -80}}>
                                                    <Card
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
                                            )
                                        })}
                                    </GroupCardContainer>
                                );
                            })}
                        </ColumnCardContainer>
                    </Column>
                )
            })}
        </div>
    );
}

