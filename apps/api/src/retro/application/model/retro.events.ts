import { RoomState } from 'src/retro/application/roomstate.validator'
import { ActionPoint, Card, RetroColumn, Vote } from '../../domain/model/retroRoom.interface'

interface UserData {
  id: string
  isReady: boolean
}

export interface RoomSyncEvent {
  id: string
  teamId: string
  createdDate: Date
  maxVotes: number
  usersReady: number
  roomState: RoomState
  timerEnds: number
  discussionCardId: string | null
  cards: Card[]
  retroColumns: RetroColumn[]
  actionPoints: ActionPoint[]
  users: UserData[]
  votes: Vote[]
  serverTime: number
}
