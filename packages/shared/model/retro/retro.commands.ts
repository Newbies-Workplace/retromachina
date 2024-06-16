import { RoomState } from "./retro.events";

export interface UpdateReadyStateCommand {
  readyState: boolean;
}

export interface CreateCardCommand {
  id: string;
  text: string;
  columnId: string;
}

export interface UpdateCardCommand {
  cardId: string;
  text: string;
}

export interface DeleteCardCommand {
  cardId: string;
}

export interface UpdateWriteStateCommand {
  writeState: boolean;
  columnId: string;
}

export interface UpdateCreatingTaskStateCommand {
  creatingTaskState: boolean;
}

export interface UpdateRoomStateCommand {
  roomState: RoomState;
}

export interface ChangeTimerCommand {
  timestamp: number | null;
}

export interface AddCardVoteCommand {
  parentCardId: string;
}

export interface RemoveCardVoteCommand {
  parentCardId: string;
}

export interface ChangeVoteAmountCommand {
  votesAmount: number;
}

export interface AddCardToCardCommand {
  parentCardId: string;
  cardId: string;
}

export interface MoveCardToColumnCommand {
  columnId: string;
  cardId: string;
}

export interface CreateTaskCommand {
  description: string;
  ownerId: string;
}

export interface DeleteTaskCommand {
  taskId: string;
}

export interface UpdateTaskCommand {
  taskId: string;
  ownerId: string | null;
  description: string;
}

export interface ChangeSlotMachineVisibilityCommand {
  isVisible: boolean;
}

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface DrawMachineCommand {}

export interface ChangeCurrentDiscussCardCommand {
  cardId: string;
}
