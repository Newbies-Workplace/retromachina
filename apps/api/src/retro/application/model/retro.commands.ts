export interface UpdateReadyStateCommand {
  readyState: true;
}

export interface CreateCardCommand {
  id: string;
  text: string;
  columnId: string;
  cardId: string;
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
  roomState: 'reflection' | 'group' | 'vote' | 'discuss' | 'summary';
}

export interface ChangeTimerCommand {
  timestamp: number;
}

export interface VoteOnCardCommand {
  parentCardId: string;
}

export interface RemoveVoteOnCardCommand {
  parentCardId: string;
}

export interface ChangeVoteAmountCommand {
  votesAmount: number;
}

export interface CardAddToCardCommand {
  parentCardId: string;
  cardId: string;
}

export interface MoveCardToColumnCommand {
  columnId: string;
  cardId: string;
}

export interface AddActionPointCommand {
  text: string;
  ownerId: string;
}

export interface DeleteActionPointCommand {
  actionPointId: string;
}

export interface ChangeActionPointOwnerCommand {
  actionPointId: string;
  ownerId: string;
  text: string;
}

export interface ChangeCurrentDiscussCardCommand {
  cardId: string;
}
