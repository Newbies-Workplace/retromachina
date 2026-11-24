import type { UserRole } from "../user/user.role";
import type { PokerCard, PokerDeck } from "./poker.types";

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
  /** Snapshot of the active deck, so clients need no extra request to render it. */
  deck: PokerDeck;
  cardsRevealed: boolean;
  users: ActivePokerUser[];
}
