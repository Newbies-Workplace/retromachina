import type { PokerCard, PokerDeckId } from "./poker.types";

export interface SelectPokerDeckCommand {
  deckId: PokerDeckId;
}

export interface SelectPokerCardCommand {
  card: PokerCard | null;
}
