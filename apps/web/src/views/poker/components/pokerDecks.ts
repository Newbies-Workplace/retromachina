import {
  POKER_DECKS,
  type PokerCard,
  type PokerDeckId,
} from "shared/model/poker/poker.types";

export const pokerDecks: ReadonlyArray<{
  id: PokerDeckId;
  name: string;
  values: readonly PokerCard[];
}> = [
  {
    id: "tshirt",
    name: "Talia koszulkowa",
    values: POKER_DECKS.tshirt,
  },
  {
    id: "standard",
    name: "Talia zwykła",
    values: POKER_DECKS.standard,
  },
];
