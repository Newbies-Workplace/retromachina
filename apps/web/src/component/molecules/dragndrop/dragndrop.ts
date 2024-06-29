const privateKey = Symbol("Card");

type Card = {
  [privateKey]: true;
  cardId: string;
  columnId: string;
  parentCardId: string | null;
};

export function getCard(data: Omit<Card, typeof privateKey>) {
  return {
    [privateKey]: true,
    ...data,
  };
}

export function isCard(data: Record<string | symbol, unknown>): data is Card {
  return Boolean(data[privateKey]);
}
