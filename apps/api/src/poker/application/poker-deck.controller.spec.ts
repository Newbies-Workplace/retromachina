import { ForbiddenError } from "@casl/ability";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import type { JWTUser } from "../../auth/jwt/JWTUser";
import { PokerDeckController } from "./poker-deck.controller";

jest.mock(
  "generated/prisma/client",
  () => ({ Role: { USER: "USER", ADMIN: "ADMIN", OWNER: "OWNER" } }),
  { virtual: true },
);
jest.mock("../../prisma/prisma.service", () => ({ PrismaService: class {} }));
jest.mock("./poker.gateway", () => ({ PokerGateway: class {} }));
jest.mock(
  "src/auth/jwt/jwt.guard",
  () => jest.requireActual("../../auth/jwt/jwt.guard"),
  { virtual: true },
);
jest.mock(
  "src/auth/jwt/jwtuser.decorator",
  () => jest.requireActual("../../auth/jwt/jwtuser.decorator"),
  { virtual: true },
);

const member = {
  id: "user",
  teams: [{ id: "team", role: "USER" }],
} as unknown as JWTUser;
const outsider = { id: "other", teams: [] } as unknown as JWTUser;

const setup = () => {
  const prisma = {
    team: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "team" }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    pokerDeck: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(({ data }) => ({ id: "deck-1", ...data })),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const gateway = {
    notifyDeckUpdated: jest.fn(),
    notifyDeckRemoved: jest.fn(),
  };
  const controller = new PokerDeckController(
    prisma as never,
    new AuthAbilityFactory(),
    gateway as never,
  );
  return { prisma, gateway, controller };
};

describe("PokerDeckController", () => {
  test("lets a regular team member create a deck", async () => {
    const { prisma, controller } = setup();

    await expect(
      controller.createDeck(member, "team", {
        name: " Fibonacci ",
        cards: ["1", "2", "3"],
      }),
    ).resolves.toEqual({
      id: "deck-1",
      name: "Fibonacci",
      cards: ["1", "2", "3"],
      source: "team",
    });
    expect(prisma.pokerDeck.create).toHaveBeenCalledWith({
      data: { team_id: "team", name: "Fibonacci", cards: ["1", "2", "3"] },
    });
  });

  test("rejects users outside the team", async () => {
    const { prisma, controller } = setup();

    await expect(controller.getDecks(outsider, "team")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      controller.createDeck(outsider, "team", { name: "X", cards: ["1", "2"] }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(prisma.pokerDeck.create).not.toHaveBeenCalled();
  });

  test("rejects invalid decks", async () => {
    const { prisma, controller } = setup();

    await expect(
      controller.createDeck(member, "team", { name: "X", cards: ["1"] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.pokerDeck.create).not.toHaveBeenCalled();
  });

  test("updates a deck scoped to the team and refreshes the poker room", async () => {
    const { prisma, gateway, controller } = setup();

    await controller.updateDeck(member, "team", "deck-1", {
      name: "Fib",
      cards: ["1", "2"],
    });

    expect(prisma.pokerDeck.updateMany).toHaveBeenCalledWith({
      where: { id: "deck-1", team_id: "team" },
      data: { name: "Fib", cards: ["1", "2"] },
    });
    expect(gateway.notifyDeckUpdated).toHaveBeenCalledWith("team", {
      id: "deck-1",
      name: "Fib",
      cards: ["1", "2"],
      source: "team",
    });
  });

  test("returns 404 for decks of another team", async () => {
    const { prisma, gateway, controller } = setup();
    prisma.pokerDeck.updateMany.mockResolvedValue({ count: 0 });
    prisma.pokerDeck.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      controller.updateDeck(member, "team", "foreign", {
        name: "Fib",
        cards: ["1", "2"],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      controller.deleteDeck(member, "team", "foreign"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(gateway.notifyDeckUpdated).not.toHaveBeenCalled();
    expect(gateway.notifyDeckRemoved).not.toHaveBeenCalled();
  });

  test("deletes a deck and tells the poker room", async () => {
    const { prisma, gateway, controller } = setup();

    await controller.deleteDeck(member, "team", "deck-1");

    expect(prisma.pokerDeck.deleteMany).toHaveBeenCalledWith({
      where: { id: "deck-1", team_id: "team" },
    });
    expect(gateway.notifyDeckRemoved).toHaveBeenCalledWith("team", "deck-1");
  });

  test("forgets a deleted deck as the team's last choice", async () => {
    const { prisma, controller } = setup();

    await controller.deleteDeck(member, "team", "deck-1");

    expect(prisma.team.updateMany).toHaveBeenCalledWith({
      where: { id: "team", poker_deck_id: "deck-1" },
      data: { poker_deck_id: null },
    });
  });

  test("keeps the last choice when deleting a deck of another team", async () => {
    const { prisma, controller } = setup();
    prisma.pokerDeck.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      controller.deleteDeck(member, "team", "foreign"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.team.updateMany).not.toHaveBeenCalled();
  });
});
