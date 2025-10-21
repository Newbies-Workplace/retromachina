export interface CardMoveAction {
  cardId: string;
  targetId: string;
  targetType: "card" | "column";
}

const cardPrivateKey = Symbol("Card");
const reflectionCardPrivateKey = Symbol("ReflectionCard");

type Card = {
  [cardPrivateKey]: true;
  cardId: string;
  columnId: string;
  parentCardId: string | null;
};

type ReflectionCard = {
  reflectionCardId: string;
  text: string;
};

export function getCard(data: Omit<Card, typeof cardPrivateKey>) {
  return {
    [cardPrivateKey]: true,
    ...data,
  };
}

export function isCard(data: Record<string | symbol, unknown>): data is Card {
  return Boolean(data[cardPrivateKey]);
}

export function getReflectionCard(
  data: Omit<ReflectionCard, typeof reflectionCardPrivateKey>,
) {
  return {
    [reflectionCardPrivateKey]: true,
    ...data,
  };
}

export function isReflectionCard(
  data: Record<string | symbol, unknown>,
): data is ReflectionCard {
  return Boolean(data[reflectionCardPrivateKey]);
}
