import {useRetro} from "../../../context/retro/RetroContext.hook"
import styles from "./ReflectionView.module.scss"
import {Column} from "../../../component/molecules/column/Column"
import DeleteIcon from "../../../assets/icons/delete-icon.svg"
import { useUser } from "../../../context/user/UserContext.hook"
import React from "react";
import {ColumnInput} from "../../../component/molecules/column/ColumnInput";
import {Card} from "../../../component/molecules/card/Card";
import {Button} from "../../../component/atoms/button/Button";

export const ReflectionView: React.FC = () => {
    const {user} = useUser();
    const {teamUsers, columns, cards, setWriting, createCard, updateCard, deleteCard} = useRetro()

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

                        <ColumnInput
                            columnData={column}
                            onCardCreated={(value) => {
                                createCard(value, column.id)
                            }}
                            onIsWriting={(value) => {
                                setWriting(value, column.id);
                            }}/>

                        {columnCards?.filter((card) => card.authorId === user?.id).map((card) => {
                            const user = teamUsers.find((user) => user.id === card.authorId);

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
                                        size={'round'}
                                        onClick={() => deleteCard(card.id)}
                                        className={styles.deleteButton}>
                                        <DeleteIcon/>
                                    </Button>
                                </Card>
                            );
                        })}
                    </Column>
                )
            })}
        </div>
    );
}

