import {Card, Vote} from "shared/model/retro/retroRoom.interface";

export const useCardGroups = (cards: Card[], votes: Vote[]): Group[] => {
    return cards.filter(c => c.parentCardId === null)
        .map(parent => {
            const groupCards = [parent, ...cards.filter(c => c.parentCardId === parent.id)]
            const count = groupCards.map((c) => votes.filter(v => v.parentCardId === c.id).length)
                .reduce((a, c) => a + c, 0)

            return {
                parentCardId: parent.id,
                cards: groupCards,
                votes: count
            }
        })
}

export interface Group {
    parentCardId: string
    votes: number
    cards: Card[]
}
