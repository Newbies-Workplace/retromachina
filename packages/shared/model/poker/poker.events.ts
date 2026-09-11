import type { UserRole } from "../user/user.role";
import type { PokerCard, PokerDeckId } from "./poker.types";

export interface ActivePokerUser {
  userId: string;
  avatarLink: string;
  role: UserRole;
  selectedCard: PokerCard | null;
}

export interface PokerSyncEvent {
  deckId: PokerDeckId;
  users: ActivePokerUser[];
}
