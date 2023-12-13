import React, {useEffect, useState} from "react"
import {Card} from "../../../component/molecules/card/Card"
import {Input} from "../../../component/atoms/input/Input"
import {useRetro} from "../../../context/retro/RetroContext.hook"
import styles from "./DiscussView.module.scss"
import DeleteIcon from "../../../assets/icons/delete-icon.svg";
import {useUser} from "../../../context/user/UserContext.hook";
import {Group, useCardGroups} from "../../../context/useCardGroups";
import {Avatar} from "../../../component/atoms/avatar/Avatar";
import {usePlural} from "../../../context/usePlural";
import {GroupCardContainer} from "../../../component/molecules/dragndrop/group_card_container/GroupCardContainer";
import {Button} from "../../../component/atoms/button/Button";

export const DiscussView = () => {
    const {
        cards,
        teamUsers,
        votes,
        createActionPoint,
        deleteActionPoint,
        updateActionPoint,
        actionPoints,
        discussionCardId,
    } = useRetro();
    const [value, setValue] = useState("")
    const { user } = useUser()
    const [groups, setGroups] = useState<Group[]>([])

    useEffect(() => {
        setGroups(useCardGroups(cards, votes))
    }, [cards, votes])

    return (
        <div className={styles.content}>
            <div className={styles.upNextSection}>
                <span className={styles.header}>Już za chwilę...</span>
                {groups.sort((a, b) => (b.votes - a.votes))
                    .filter((group, groupIndex) => {
                        const discussIndex = groups.findIndex(g => g.parentCardId === discussionCardId)
                        return discussIndex < groupIndex
                    })
                    .map(group => {
                        return (
                            <GroupCardContainer
                                key={group.parentCardId}
                                parentCardId={group.parentCardId}
                                onCardDropped={() => {}}
                            >
                                {group.cards.map((card, index) => {
                                    const author = teamUsers.find((user) => user.id === card.authorId);

                                    return (
                                        <Card
                                            key={card.id}
                                            style={{ marginTop: index === 0 ? 0 : -80 }}
                                            text={card.text}
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
                                            {group.cards.length === index + 1 &&
                                                <div className={styles.votes}>
                                                    <span className={styles.voteNumber}>{group.votes}</span>
                                                </div>
                                            }
                                        </Card>
                                    )
                                })}
                            </GroupCardContainer>
                        )
                    })}
            </div>

            {discussionCardId &&
                <div className={styles.currentCardSection}>
                    {(() => {
                        const group = groups.find(g => g.parentCardId === discussionCardId)!
                        if (!group) {
                            return null
                        }

                        return (
                            <div className={styles.discussCardWrapper}>
                                {group.cards.map(card => {
                                    const author = teamUsers.find(u => u.id === card.authorId)

                                    return (
                                        <div key={card.id} className={styles.card}>
                                            <Avatar url={author?.avatar_link ?? ""} size={24}/>

                                            {card.text}
                                        </div>
                                    )
                                })}

                                <span className={styles.groupVotes}>
                                    {group.votes} {usePlural(group.votes, {one: "głos", few: "głosy", other: "głosów"})}
                                </span>
                            </div>
                        )
                    })()}
                </div>
            }

            <div className={styles.actionPointsSection}>
                <div className={styles.actionPointContent}>
                    <div className={styles.actionPointList}>
                        {actionPoints?.filter((actionPoint) => actionPoint.parentCardId === discussionCardId)
                            .map((actionPoint) => {
                                const author = teamUsers.find((teamUser) => teamUser.id === actionPoint.ownerId)

                                return (
                                    <Card
                                        key={actionPoint.id}
                                        editableUser
                                        editableText
                                        onUpdate={(ownerId, text) => {
                                            updateActionPoint(actionPoint.id, ownerId, text)
                                        }}
                                        teamUsers={teamUsers.map((user) => ({
                                            id: user.id,
                                            name: user.nick,
                                            avatar: user.avatar_link,
                                        }))}
                                        text={actionPoint.text}
                                        author={author ? {
                                            avatar: author.avatar_link,
                                            name: author.nick,
                                            id: author.id,
                                        } : undefined}>
                                        <Button
                                            size={'round'}
                                            onClick={() => deleteActionPoint(actionPoint.id)}
                                            className={styles.deleteButton}>
                                            <DeleteIcon/>
                                        </Button>
                                    </Card>
                                )
                            })}
                    </div>

                    <div className={styles.actionPointInput}>
                        <Input
                            multiline
                            value={value}
                            setValue={setValue}
                            placeholder={"Nowy action point..."}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    createActionPoint(value, user?.id!)
                                    setValue("");
                                }
                            }} />
                    </div>
                </div>
            </div>
        </div>
    )
}