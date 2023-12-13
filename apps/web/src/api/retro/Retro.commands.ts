export interface ReadyCommand {
    readyState: boolean
}

export interface CreateCardCommand {
    id: string
    text: string
    authorId: string
    columnId: string
}

export interface UpdateCardCommand {
    cardId: string
    text: string
}

export interface DeleteCardCommand {
    cardId: string,
}

export interface WriteStateCommand {
    writeState: boolean
    columnId: string
}

export interface SetTimerCommand {
    timestamp: number | null
}

export interface RoomStateCommand {
    roomState: RoomState
}

export interface AddCardToCardCommand {
    parentCardId: string
    cardId: string
}

export interface MoveCardToColumnCommand {
    columnId: string
    cardId: string
}
export interface UpdateActionPointCommand {
    actionPointId: string
    ownerId: string
    text: string
}
export interface CreateActionPointCommand {
    text: string
    ownerId: string
}

export interface DeleteActionPointCommand {
    actionPointId: string
}

export interface AddVoteCommand {
    parentCardId: string
}
export interface RemoveVoteCommand {
    parentCardId: string
}
export interface SetMaxVotesCommand {
    votesAmount: number
}

export interface ChangeCurrentDiscussCardCommand {
    cardId: string
}

export type RoomState = "reflection" | "group" | "vote" | "discuss";
