export interface Card {
  id: string;
  text: string;
  authorId: string;
  columnId: string;
  parentCardId?: string;
}

export interface User {
  userId: string;
  isReady: boolean;
  writingInColumns: Set<string>;
}

export interface RetroColumn {
  id: string;
  color: string;
  name: string;
  description: string;
  cards: Card[];
  teamCardsAmount: number;
  isWriting: boolean;
}

export interface Vote {
  parentCardId: string;
  voterId: string;
}

export interface ActionPoint {
  id: string;
  ownerId: string;
  text: string;
  parentCardId: string;
}
