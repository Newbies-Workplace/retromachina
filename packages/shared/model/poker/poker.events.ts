import type { UserRole } from "../user/user.role";
import type { PokerCard, PokerDeckId } from "./poker.types";

export interface ActivePokerUser {
  userId: string;
  nick: string;
  avatarLink: string;
  role: UserRole;
  selectedCard: PokerCard | null;
  revealedCard: PokerCard | null;
}

export interface PokerSyncEvent {
  deckId: PokerDeckId;
  cardsRevealed: boolean;
  users: ActivePokerUser[];
}
