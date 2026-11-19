import { BadRequestException } from "@nestjs/common";
import { DEFAULT_POKER_DECKS } from "shared/model/poker/poker.types";
import {
  findPokerDeck,
  findRememberedPokerDeck,
  getEffectivePokerDecks,
  parsePokerDeckRequest,
  rememberPokerDeck,
} from "./poker-decks";

const storedDeck = {
  id: "deck-1",
  team_id: "team",
  name: "Fibonacci",
  cards: ["1", "2", "3", "5"],
  created_at: new Date(),
};

describe("poker decks", () => {
  test("lists default decks before the team's own decks", async () => {
    const prisma = {
      pokerDeck: { findMany: jest.fn().mockResolvedValue([storedDeck]) },
    };

    const decks = await getEffectivePokerDecks(prisma as never, "team");

    expect(decks.map((deck) => deck.id)).toEqual([
      "tshirt",
      "standard",
      "deck-1",
    ]);
    expect(decks[2]).toEqual({
      id: "deck-1",
      name: "Fibonacci",
      cards: ["1", "2", "3", "5"],
      source: "team",
    });
    expect(prisma.pokerDeck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { team_id: "team" } }),
    );
  });

  test("resolves default decks without a database query", async () => {
    const prisma = { pokerDeck: { findFirst: jest.fn() } };

    await expect(
      findPokerDeck(prisma as never, "team", "tshirt"),
    ).resolves.toEqual(DEFAULT_POKER_DECKS[0]);
    expect(prisma.pokerDeck.findFirst).not.toHaveBeenCalled();
  });

  test("resolves only decks owned by the team", async () => {
    const prisma = {
      pokerDeck: { findFirst: jest.fn().mockResolvedValue(storedDeck) },
    };

    await expect(
      findPokerDeck(prisma as never, "team", "deck-1"),
    ).resolves.toMatchObject({ id: "deck-1", source: "team" });
    expect(prisma.pokerDeck.findFirst).toHaveBeenCalledWith({
      where: { id: "deck-1", team_id: "team" },
    });
  });

  test.each([
    "constructor",
    "__proto__",
    "unknown",
    "",
    42,
    null,
  ])("rejects deck id %p", async (deckId) => {
    const prisma = {
      pokerDeck: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    await expect(
      findPokerDeck(prisma as never, "team", deckId),
    ).resolves.toBeUndefined();
  });

  test("normalizes a valid request", () => {
    expect(
      parsePokerDeckRequest({ name: "  Fib ", cards: [" 1", "2 ", "", "☕"] }),
    ).toEqual({ name: "Fib", cards: ["1", "2", "☕"] });
  });

  test.each([
    [{ name: "", cards: ["1", "2"] }, "Nazwa talii jest wymagana"],
    [{ name: "x".repeat(51), cards: ["1", "2"] }, "maksymalnie 50 znaków"],
    [{ name: "Deck", cards: ["1"] }, "co najmniej 2"],
    [
      { name: "Deck", cards: Array.from({ length: 16 }, (_, i) => `${i}`) },
      "maksymalnie 15 kart",
    ],
    [{ name: "Deck", cards: ["1", "12345"] }, "za długa"],
    [{ name: "Deck", cards: ["1", "1"] }, "więcej niż raz"],
    [{ name: "Deck", cards: "1,2" }, "Nieprawidłowa lista kart"],
    [{ name: "Deck", cards: ["1", 2] }, "Nieprawidłowa lista kart"],
    [null, "Nieprawidłowa talia"],
  ])("rejects invalid request %p", (request, message) => {
    expect(() => parsePokerDeckRequest(request)).toThrow(BadRequestException);
    expect(() => parsePokerDeckRequest(request)).toThrow(message);
  });

  describe("remembered deck", () => {
    const setup = (pokerDeckId: string | null, teamDeck = storedDeck) => ({
      team: {
        findUnique: jest.fn().mockResolvedValue({ poker_deck_id: pokerDeckId }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      pokerDeck: { findFirst: jest.fn().mockResolvedValue(teamDeck) },
    });

    test("returns nothing when the team has not picked a deck yet", async () => {
      const prisma = setup(null);

      await expect(
        findRememberedPokerDeck(prisma as never, "team"),
      ).resolves.toBeUndefined();
      expect(prisma.pokerDeck.findFirst).not.toHaveBeenCalled();
    });

    test("returns a remembered default deck", async () => {
      const prisma = setup("tshirt");

      await expect(
        findRememberedPokerDeck(prisma as never, "team"),
      ).resolves.toMatchObject({ id: "tshirt", source: "default" });
    });

    test("returns a remembered team deck", async () => {
      const prisma = setup("deck-1");

      await expect(
        findRememberedPokerDeck(prisma as never, "team"),
      ).resolves.toMatchObject({ id: "deck-1", source: "team" });
      expect(prisma.pokerDeck.findFirst).toHaveBeenCalledWith({
        where: { id: "deck-1", team_id: "team" },
      });
    });

    test("ignores a remembered deck that no longer exists", async () => {
      const prisma = setup("deleted", null as never);

      await expect(
        findRememberedPokerDeck(prisma as never, "team"),
      ).resolves.toBeUndefined();
    });

    test("stores the chosen deck on the team", async () => {
      const prisma = setup(null);

      await rememberPokerDeck(prisma as never, "team", "deck-1");

      expect(prisma.team.updateMany).toHaveBeenCalledWith({
        where: { id: "team" },
        data: { poker_deck_id: "deck-1" },
      });
    });
  });
});
