import { createContext } from "react";
import type { ActivePokerUser } from "shared/model/poker/poker.events";
import {
  getDefaultPokerDeck,
  type PokerCard,
  type PokerDeck,
  type PokerDeckId,
} from "shared/model/poker/poker.types";

export const INITIAL_POKER_DECK: PokerDeck = getDefaultPokerDeck() ?? {
  id: "standard",
  name: "Talia zwykła",
  cards: [],
};

export type PokerContextValue = {
  teamId: string;
  deck: PokerDeck;
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
  deck: INITIAL_POKER_DECK,
  cardsRevealed: false,
  activeUsers: [],
  selectDeck: () => {},
  selectCard: () => {},
  revealCards: () => {},
  clearTable: () => {},
});
