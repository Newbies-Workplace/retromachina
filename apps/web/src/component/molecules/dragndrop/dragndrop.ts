export const ItemTypes = {
    CARD: 'card',
}

export interface CardDragPayload {
    parentCardId: string | null
    cardId: string
    columnId: string
}