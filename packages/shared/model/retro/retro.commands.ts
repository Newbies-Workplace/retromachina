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

export interface CreateActionPointCommand {
	text: string;
	ownerId: string;
}

export interface DeleteActionPointCommand {
	actionPointId: string;
}

export interface UpdateActionPointCommand {
	actionPointId: string;
	ownerId: string;
	text: string;
}

export interface ChangeCurrentDiscussCardCommand {
	cardId: string;
}
