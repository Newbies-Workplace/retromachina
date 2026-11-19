import { BadRequestException } from "@nestjs/common";
import {
  DEFAULT_POKER_DECKS,
  type PokerDeckRequest,
  type PokerDeckResponse,
  validatePokerDeck,
} from "shared/model/poker/poker.types";
import type { PrismaService } from "../prisma/prisma.service";

type StoredPokerDeck = {
  id: string;
  name: string;
  cards: unknown;
};

export const toTeamPokerDeckResponse = (
  deck: StoredPokerDeck,
): PokerDeckResponse => ({
  id: deck.id,
  name: deck.name,
  cards: Array.isArray(deck.cards)
    ? deck.cards.filter((card): card is string => typeof card === "string")
    : [],
  source: "team",
});

/** Default decks first, then the team's own decks in creation order. */
export async function getEffectivePokerDecks(
  prisma: PrismaService,
  teamId: string,
): Promise<PokerDeckResponse[]> {
  const decks = await prisma.pokerDeck.findMany({
    where: { team_id: teamId },
    orderBy: { created_at: "asc" },
  });
  return [...DEFAULT_POKER_DECKS, ...decks.map(toTeamPokerDeckResponse)];
}

/** Resolves a deck id the team may use; undefined for unknown ids. */
export async function findPokerDeck(
  prisma: PrismaService,
  teamId: string,
  deckId: unknown,
): Promise<PokerDeckResponse | undefined> {
  if (typeof deckId !== "string" || deckId.length === 0) return undefined;

  const defaultDeck = DEFAULT_POKER_DECKS.find((deck) => deck.id === deckId);
  if (defaultDeck) return defaultDeck;

  const teamDeck = await prisma.pokerDeck.findFirst({
    where: { id: deckId, team_id: teamId },
  });
  return teamDeck ? toTeamPokerDeckResponse(teamDeck) : undefined;
}

/** The deck the team used last, if it still exists. */
export async function findRememberedPokerDeck(
  prisma: PrismaService,
  teamId: string,
): Promise<PokerDeckResponse | undefined> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { poker_deck_id: true },
  });
  return team?.poker_deck_id
    ? findPokerDeck(prisma, teamId, team.poker_deck_id)
    : undefined;
}

/** Stores the deck chosen at the table so the next session starts with it. */
export async function rememberPokerDeck(
  prisma: PrismaService,
  teamId: string,
  deckId: string | null,
) {
  await prisma.team.updateMany({
    where: { id: teamId },
    data: { poker_deck_id: deckId },
  });
}

export function parsePokerDeckRequest(request: unknown): PokerDeckRequest {
  const result = validatePokerDeck(request);
  if ("error" in result) throw new BadRequestException(result.error);
  return result.deck;
}
