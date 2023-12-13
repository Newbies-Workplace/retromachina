export interface CardMoveAction {
    cardId: string
    targetId: string
    targetType: 'card' | 'column'
}