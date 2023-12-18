import React from "react";
import {useDrop} from "react-dnd";
import styles from '../column/ColumnCardContainer.module.scss'
import {CardDragPayload, ItemTypes} from "./dragndrop";

interface ColumnCardContainerProps {
    columnId: string
    onCardDropped: (cardId: string, fromColumnId: string) => void
}

export const ColumnCardContainer: React.FC<React.PropsWithChildren<ColumnCardContainerProps>> = ({children, columnId, onCardDropped}) => {
    const [{ isOverCurrent, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.CARD,
        drop: (item: CardDragPayload, monitor) => {
            if (!monitor.didDrop()) {
                onCardDropped(item.cardId, item.columnId)
            }
        },
        canDrop: (item: CardDragPayload) => item.parentCardId !== null || item.columnId !== columnId,
        collect: (monitor) => ({
            isOverCurrent: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        })
    }), [columnId])

    return <div
        ref={drop}
        style={{
            border: isOverCurrent && canDrop
                ? '0.5px dashed black'
                : '0.5px solid transparent',
        }}
        className={styles.container}>
        {children}
    </div>
}
