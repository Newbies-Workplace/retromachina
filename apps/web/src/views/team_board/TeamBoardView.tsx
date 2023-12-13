import React, {useState} from "react";
import {useNavigate} from "react-router";
import Navbar from "../../component/organisms/navbar/Navbar";
import styles from "./TeamBoardView.module.scss";
import DeleteIcon from './../../assets/icons/delete-icon.svg'
import AddIcon from './../../assets/icons/add-icon.svg'
import {Button} from "../../component/atoms/button/Button";
import {Column} from "../../component/molecules/column/Column";
import {ColumnCardContainer} from "../../component/molecules/dragndrop/ColumnCardContainer";
import {DraggableCard} from "../../component/molecules/dragndrop/DraggableCard";
import {Card} from "../../component/molecules/card/Card";
import {useBoard} from "../../context/board/BoardContext.hook";
import {useUser} from "../../context/user/UserContext.hook";
import {TaskResponse} from "../../api/task/Task.interface";
import {v4 as uuidv4} from "uuid";

export const TeamBoardView: React.FC = () => {
    const {board, team, teamUsers, moveTask, createTask, updateTask, deleteTask} = useBoard()
    const [creatingTask, setCreatingTask] = useState<TaskResponse>()
    const {user} = useUser()
    const navigate = useNavigate()

    if (!board || !user) {
        return <div>
            loading
        </div>
    }

    const onEditClick = () => {
        navigate("edit")
    }

    const onCreateCardClick = (columnId: string) => {
        setCreatingTask({
            id: uuidv4(),
            text: '',
            columnId: columnId,
            ownerId: user?.id
        })
    }

    return (
        <>
            <Navbar topContent={
                team?.owner_id === user?.id &&
                <Button size={"small"} onClick={onEditClick}>
                    Edytuj
                </Button>
            } />

            <div className={styles.container}>
                {board.columns?.sort((a, b) => a.order - b.order).map(column =>
                    <Column
                        key={column.id}
                        headerStyle={styles.headerStyle}
                        columnData={{
                            name: column.name,
                            color: column.color,
                            description: null
                        }}
                        headerRight={
                            <Button size={'round'} onClick={() => onCreateCardClick(column.id)}>
                                <AddIcon/>
                            </Button>
                        }>

                        <ColumnCardContainer
                            columnId={column.id}
                            onCardDropped={(taskId) => moveTask(taskId, column.id)}>

                            {creatingTask && creatingTask?.columnId === column.id && (
                                (() => {
                                    const author = teamUsers.find((user) => user.id === creatingTask.ownerId)

                                    return (
                                        <Card
                                            text={creatingTask.text}
                                            author={{
                                                avatar: author?.avatar_link || "",
                                                name: author?.nick || "",
                                                id: creatingTask.ownerId,
                                            }}
                                            teamUsers={[]}
                                            editableText
                                            autoFocus
                                            onEditDismiss={() => {
                                                setCreatingTask(undefined)
                                            }}
                                            onUpdate={(ownerId, text) => {
                                                createTask(creatingTask.id, text, ownerId, column.id)
                                                setCreatingTask(undefined)
                                            }}
                                        />
                                    )
                                })())
                            }

                            {board.tasks.filter(task => task.columnId === column.id).map(task => {
                                const author = teamUsers.find((user) => user.id === task.ownerId);

                                return (
                                    <DraggableCard
                                        key={task.id}
                                        parentCardId={null}
                                        cardId={task.id}
                                        columnId={column.id}>
                                        <Card
                                            text={task.text}
                                            author={{
                                                avatar: author?.avatar_link || "",
                                                name: author?.nick || "",
                                                id: task.ownerId,
                                            }}
                                            teamUsers={teamUsers.map((user) => ({
                                                id: user.id,
                                                name: user.nick,
                                                avatar: user.avatar_link,
                                            }))}
                                            editableUser
                                            editableText
                                            onUpdate={(ownerId, text) => updateTask(task.id, ownerId, text)}
                                        >
                                            <Button
                                                size={'round'}
                                                onClick={() => deleteTask(task.id)}
                                                className={styles.deleteButton}>
                                                <DeleteIcon/>
                                            </Button>
                                        </Card>
                                    </DraggableCard>
                                )
                            })}
                        </ColumnCardContainer>
                    </Column>
                )}
            </div>
        </>
    )
}