export type PokerDeckId = "tshirt" | "standard";
export type PokerCard =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "1"
  | "2"
  | "4"
  | "8"
  | "16"
  | "24"
  | "32";

export const POKER_DECKS = {
  tshirt: ["XS", "S", "M", "L", "XL", "XXL"],
  standard: ["1", "2", "4", "8", "16", "24", "32"],
} as const satisfies Record<PokerDeckId, readonly PokerCard[]>;
