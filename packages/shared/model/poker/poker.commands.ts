import type { PokerCard, PokerDeckId } from "./poker.types";

export interface SelectPokerDeckCommand {
  deckId: PokerDeckId;
}

export interface SelectPokerCardCommand {
  card: PokerCard | null;
}

export type RevealPokerCardsCommand = Record<string, never>;

export type ClearPokerTableCommand = Record<string, never>;
