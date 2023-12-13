import {SocketCard, SocketVote} from "../api/retro/Retro.events";

export const useCardGroups = (cards: SocketCard[], votes: SocketVote[]): Group[] => {
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
    cards: SocketCard[]
}