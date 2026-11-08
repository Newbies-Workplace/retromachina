import type { UserRole } from "../user/user.role";
import type { PokerCard, PokerDeckId } from "./poker.types";

export interface ActivePokerUser {
  userId: string;
  nick: string;
  avatarLink: string;
  role: UserRole;
  /** Whether the user picked a card; visible to everyone before the reveal. */
  hasSelectedCard: boolean;
  /** Only sent to the user who picked it; null for other users. */
  selectedCard: PokerCard | null;
  revealedCard: PokerCard | null;
}

export interface PokerSyncEvent {
  deckId: PokerDeckId;
  cardsRevealed: boolean;
  users: ActivePokerUser[];
}
