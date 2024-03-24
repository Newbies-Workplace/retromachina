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

export interface UpdateRoomStateCommand {
  roomState: "reflection" | "group" | "vote" | "discuss" | "summary";
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
  ownerId: string;
  description: string;
}

export interface ChangeCurrentDiscussCardCommand {
  cardId: string;
}
