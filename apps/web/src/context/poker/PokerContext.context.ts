import { createContext } from "react";
import type { ActivePokerUser } from "shared/model/poker/poker.events";
import type { PokerCard, PokerDeckId } from "shared/model/poker/poker.types";

export type PokerContextValue = {
  teamId: string;
  deckId: PokerDeckId;
  cardsRevealed: boolean;
  selectedCard?: PokerCard;
  activeUsers: ActivePokerUser[];
  selectDeck: (deckId: PokerDeckId) => void;
  selectCard: (card: PokerCard | null) => void;
  revealCards: () => void;
  clearTable: () => void;
};

export const PokerContext = createContext<PokerContextValue>({
  teamId: "",
  deckId: "standard",
  cardsRevealed: false,
  activeUsers: [],
  selectDeck: () => {},
  selectCard: () => {},
  revealCards: () => {},
  clearTable: () => {},
});
