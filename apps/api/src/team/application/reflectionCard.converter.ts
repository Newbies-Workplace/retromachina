import { ReflectionCard } from "generated/prisma/client";
import { ReflectionCardResponse } from "shared/model/team/reflectionCard.response";

export const toReflectionCardResponse = (
  card: ReflectionCard,
): ReflectionCardResponse => {
  return {
    id: card.id,
    text: card.text,
  };
};
