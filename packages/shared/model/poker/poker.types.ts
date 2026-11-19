export type PokerDeckId = string;
export type PokerCard = string;

export interface PokerDeck {
  id: PokerDeckId;
  name: string;
  cards: PokerCard[];
}

export interface PokerDeckResponse extends PokerDeck {
  source: "default" | "team";
}

export interface PokerDeckRequest {
  name: string;
  cards: string[];
}

export const POKER_DECK_LIMITS = {
  maxNameLength: 50,
  minCards: 2,
  maxCards: 15,
  /** Cards are rendered on small tiles, so longer labels would not fit. */
  maxCardLength: 4,
} as const;

export const DEFAULT_POKER_DECK_ID: PokerDeckId = "standard";

export const DEFAULT_POKER_DECKS: readonly PokerDeckResponse[] = [
  {
    id: "tshirt",
    name: "Talia koszulkowa",
    cards: ["?", "XS", "S", "M", "L", "XL", "XXL"],
    source: "default",
  },
  {
    id: "standard",
    name: "Talia zwykła",
    cards: ["?", "1", "2", "4", "8", "16", "24", "32"],
    source: "default",
  },
];

export const getDefaultPokerDeck = (
  deckId: PokerDeckId = DEFAULT_POKER_DECK_ID,
) => DEFAULT_POKER_DECKS.find((deck) => deck.id === deckId);

/** Splits user input such as "?, 1, 2, 3" into card labels. */
export const parsePokerCards = (input: string): string[] =>
  input
    .split(/[,;\n]/)
    .map((card) => card.trim())
    .filter((card) => card.length > 0);

export type PokerDeckValidationResult =
  | { ok: true; deck: PokerDeckRequest }
  | { ok: false; error: string };

/**
 * Normalizes and validates a custom deck. Shared by the API and the deck
 * editor, so both report the same (Polish) messages.
 */
export const validatePokerDeck = (
  request: unknown,
): PokerDeckValidationResult => {
  if (typeof request !== "object" || request === null) {
    return { ok: false, error: "Nieprawidłowa talia" };
  }
  const { name: rawName, cards: rawCards } = request as Record<string, unknown>;

  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) return { ok: false, error: "Nazwa talii jest wymagana" };
  if (name.length > POKER_DECK_LIMITS.maxNameLength) {
    return {
      ok: false,
      error: `Nazwa talii może mieć maksymalnie ${POKER_DECK_LIMITS.maxNameLength} znaków`,
    };
  }

  if (
    !Array.isArray(rawCards) ||
    rawCards.some((card) => typeof card !== "string")
  ) {
    return { ok: false, error: "Nieprawidłowa lista kart" };
  }
  const cards = (rawCards as string[])
    .map((card) => card.trim())
    .filter((card) => card.length > 0);

  if (cards.length < POKER_DECK_LIMITS.minCards) {
    return {
      ok: false,
      error: `Talia musi mieć co najmniej ${POKER_DECK_LIMITS.minCards} karty`,
    };
  }
  if (cards.length > POKER_DECK_LIMITS.maxCards) {
    return {
      ok: false,
      error: `Talia może mieć maksymalnie ${POKER_DECK_LIMITS.maxCards} kart`,
    };
  }
  const tooLong = cards.find(
    (card) => Array.from(card).length > POKER_DECK_LIMITS.maxCardLength,
  );
  if (tooLong) {
    return {
      ok: false,
      error: `Karta „${tooLong}” jest za długa (maks. ${POKER_DECK_LIMITS.maxCardLength} znaki)`,
    };
  }
  const duplicate = cards.find((card, index) => cards.indexOf(card) !== index);
  if (duplicate) {
    return {
      ok: false,
      error: `Karta „${duplicate}” występuje więcej niż raz`,
    };
  }

  return { ok: true, deck: { name, cards } };
};
