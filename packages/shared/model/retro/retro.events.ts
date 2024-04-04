import type {
  Card,
  RetroColumn,
  RetroTask,
  User,
  Vote,
} from "./retroRoom.interface";

export type RoomState = "reflection" | "group" | "vote" | "discuss";

export interface TimerChangedEvent {
  timerEnds: number | null; //timestamp
}

export interface SlotMachineDrawnEvent {
  highlightedUserId: string;
  actorId: string;
}

export interface RoomSyncEvent {
  id: string;
  teamId: string;
  retroColumns: RetroColumn[];

  roomState: RoomState;
  users: User[];
  usersReady: number;
  createdDate: Date;
  cards: Card[];

  // timer
  timerEnds: number;
  serverTime: number;

  // group
  slotMachineVisible: boolean;
  highlightedUserId: string | null;

  // vote
  maxVotes: number;
  votes: Vote[];

  // discuss
  discussionCardId: string | null;
  tasks: RetroTask[];
}
