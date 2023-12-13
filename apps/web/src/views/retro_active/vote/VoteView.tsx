import React from "react"
import {Card} from "../../../component/molecules/card/Card"
import Counter from "../../../component/molecules/card/counter/Counter"
import {Column} from "../../../component/molecules/column/Column"
import {useRetro} from "../../../context/retro/RetroContext.hook"
import {useUser} from "../../../context/user/UserContext.hook"
import {GroupCardContainer} from "../../../component/molecules/dragndrop/group_card_container/GroupCardContainer";

export const VoteView = () => {
    const {
        columns,
        cards,
        teamUsers,
        votes,
        maxVotes,
        addVote,
        removeVote,
    } = useRetro()
    const {user} = useUser()

    const votesLeft = maxVotes - votes.filter((vote) => user?.id === vote.voterId ).length

    return (
        <div style={{display: 'flex', flexDirection: 'row'}}>
            {columns?.map((column) => {
                const columnCards = cards.filter(c => c.columnId === column.id)

                return(
                    <Column
                        key={column.id}
                        columnData={{
                            color: column.color,
                            name: column.name,
                            description: column.description,
                        }}>
                        {columnCards.filter(c => c.parentCardId === null).map(group => {
                            const groupCards = [group, ...cards.filter(c => c.parentCardId === group.id)]
                            return (
                                <GroupCardContainer
                                    key={group.id}
                                    parentCardId={group.id}
                                    onCardDropped={() => {}}>
                                    {groupCards.map((card, index) => {
                                        const author = teamUsers.find((user) => user.id === card.authorId);
                                        const userVotes = votes.filter((vote) => user?.id === vote.voterId && (vote.parentCardId === card.id || vote.parentCardId == card.parentCardId)).length

                                        return (
                                            <Card
                                                key={card.id}
                                                text={card.text}
                                                style={{marginTop: index === 0 ? 0 : -80}}
                                                author={{
                                                    avatar: author?.avatar_link || "",
                                                    name: author?.nick || "",
                                                    id: card.authorId,
                                                }}
                                                teamUsers={teamUsers.map((user) => ({
                                                    id: user.id,
                                                    name: user.nick,
                                                    avatar: user.avatar_link,
                                                }))}
                                            >
                                                {groupCards.length === index + 1 &&
                                                    <Counter
                                                        style={{height: '100%'}}
                                                        canIncrement={votesLeft > 0}
                                                        count={userVotes}
                                                        onIncrement={() => {
                                                            addVote(card.id)
                                                        }}
                                                        onDecrement={() => {
                                                            removeVote(card.id)
                                                        }}/>
                                                }
                                            </Card>
                                        )})}
                                </GroupCardContainer>
                            );
                        })}
                    </Column>
                )
            })}
        </div>
    )
}