import {
  ActionPoint,
  Card,
  RetroColumn,
  User,
  Vote,
} from "./retroRoom.interface";

export type RoomState = "reflection" | "group" | "vote" | "discuss" | "summary";

export interface TimerChangedEvent {
  timerEnds: number | null; //timestamp
}

export interface RoomSyncEvent {
  id: string;
  teamId: string;
  createdDate: Date;
  maxVotes: number;
  usersReady: number;
  roomState: RoomState;
  timerEnds: number;
  discussionCardId: string | null;
  cards: Card[];
  retroColumns: RetroColumn[];
  actionPoints: ActionPoint[];
  users: User[];
  votes: Vote[];
  serverTime: number;
}
