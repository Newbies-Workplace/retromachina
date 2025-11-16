import type { UserRole } from "../user/user.role";

export interface Card {
  id: string;
  text: string;
  authorId: string;
  columnId: string;
  parentCardId: string | null;
}

export interface User {
  userId: string;
  avatar_link: string;
  role: UserRole;
  isReady: boolean;
  isCreatingTask: boolean;
  writingInColumns: Set<string>;
}

export interface RetroColumn {
  id: string;
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

export interface RetroTask {
  id: string;
  ownerId: string | null;
  description: string;
  parentCardId: string;
}
