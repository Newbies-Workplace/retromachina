import {RoomState} from "./Retro.commands";

export interface SocketVote {
    parentCardId: string,
    voterId: string
}

export interface TimerChangeEvent {
    timerEnds: number | null //timestamp
}

export interface SocketCard {
    id: string
    parentCardId: string | null
    columnId: string
    text: string
    authorId: string
}

export interface SocketColumn {
    id: string
    color: string
    name: string
    description: string | null
    teamCardsAmount: number
    isWriting: boolean
}

export interface SocketUser {
    id: string
    isReady: boolean
}
export interface ActionPoint{
    id: string,
    ownerId: string;
    text: string;
    parentCardId: string;
}

export interface RoomData {
    roomState: RoomState
    teamId: string
    createdDate: Date
    timerEnds: number | null
    discussionCardId: string | null
    maxVotes: number
    votes: SocketVote[]
    usersReady: number
    usersWriting: number
    retroColumns: SocketColumn[]
    cards: SocketCard[]
    users: SocketUser[]
    actionPoints: ActionPoint[]
    serverTime: number
}

export interface RoomSyncEvent {
    roomData: RoomData
}