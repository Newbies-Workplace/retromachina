import {Navigate, useNavigate, useParams} from "react-router";
import React, {useEffect, useState} from "react";
import Navbar from "../../component/organisms/navbar/Navbar";
import {Board, BoardColumn} from "../../api/board/Board.interface";
import {ColumnCreate} from "../../component/molecules/column_create/ColumnCreate";
import styles from "./TeamBoardEditView.module.scss";
import {Button} from "../../component/atoms/button/Button";
import AddIcon from "../../assets/icons/add-icon.svg";
import {v4 as uuidv4} from "uuid";
import {getRandomColor} from "../../common/Util";
import NextIcon from "../../assets/icons/next.svg"
import PrevIcon from "../../assets/icons/prev.svg"
import {editBoard, getBoard} from "../../api/board/Board.service";
import {toast} from "react-toastify";

const MAX_COLUMNS = 6

export const TeamBoardEditView: React.FC = () => {
    const { teamId } = useParams<{teamId: string}>()
    const navigate = useNavigate()
    const [board, setBoard] = useState<Board>()
    if (!teamId) {
        return <Navigate to={"/"}/>
    }

    useEffect(() => {
        getBoard(teamId)
            .then(board => setBoard(board))
    }, [teamId])

    if (!board) {
        return <div>
            loading
        </div>
    }

    const onAddColumn = () => {
        const column: BoardColumn = {
            id: uuidv4(),
            color: getRandomColor(),
            name: "",
            order: board.columns.length
        };

        setBoard({...board, columns: [...board.columns, column]});
    }

    const onChangeColumn = (id: string, column: BoardColumn) => {
        const columnIndex = board.columns.findIndex((col) => col.id === id);

        const newColumns = [...board.columns]
        newColumns[columnIndex] = column

        setBoard({...board, columns: newColumns})
    }

    const onChangeOrder = (from: number, action: 'next' | 'prev') => {
        const newColumns = [...board.columns]
        const to = action === 'next' ? from + 1 : from - 1
        const fromIndex = newColumns.findIndex((col) => col.order === from)
        const toIndex = newColumns.findIndex((col) => col.order === to)

        newColumns[fromIndex].order = to
        newColumns[toIndex].order = from

        setBoard({...board, columns: newColumns})
    }

    const onChangeDefaultColumn = (id: string) => {
        setBoard({...board, defaultColumnId: id})
    }

    const onDeleteColumn = (id: string) => {
        if (board.defaultColumnId === id) {
            return
        }

        const columnIndex = board.columns.findIndex((col) => col.id === id);
        const newColumns = [...board.columns]

        newColumns.splice(columnIndex, 1)

        setBoard({...board, columns: newColumns})
    }

    const saveBoard = () => {
        editBoard(teamId, board)
            .then(() => {
                navigate(`/team/${teamId}/board`)
            })
            .then(() => {
                toast.success('Tablicę zapisano')
            })
            .catch((e) => {
                console.log(e)
                toast.error('Wystąpił błąd')
            })
    }

    return (
        <>
            <Navbar topContent={
                <Button className={styles.action} size={"small"} onClick={saveBoard}>
                    Zapisz
                </Button>
            } />

            <div className={styles.container}>
                <div className={styles.columns}>
                    {board.columns.sort((a, b) => a.order - b.order).map((col, index) =>
                        <div key={col.id}>
                            <ColumnCreate
                                color={col.color}
                                name={col.name}
                                desc={""}
                                onChange={({color, name}) => onChangeColumn(col.id, {
                                    id: col.id,
                                    name: name,
                                    color: color,
                                    order: index,
                                })}
                                onDelete={() => onDeleteColumn(col.id)}
                            />

                            <div className={styles.columnAction}>
                                {index !== 0 &&
                                    <Button
                                        size={'round'}
                                        onClick={() => onChangeOrder(index, 'prev')}>
                                        <PrevIcon/>
                                    </Button>
                                }

                                {index !== board.columns.length - 1 &&
                                    <Button
                                        size={'round'}
                                        onClick={() => onChangeOrder(index, 'next')}>
                                        <NextIcon/>
                                    </Button>
                                }

                                <div onClick={() => onChangeDefaultColumn(col.id)}>
                                    <input
                                        type={"radio"}
                                        name={"default"}
                                        value={col.id}
                                        checked={board.defaultColumnId === col.id}/>
                                    <span>Domyślna</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.columnButton}>
                        <Button disabled={board.columns.length >= MAX_COLUMNS} size="big" onClick={onAddColumn}>
                            <span>Nowa Kolumna</span>
                            <AddIcon />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}