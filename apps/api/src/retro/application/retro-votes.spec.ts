import type { RetroColumn } from "shared/model/retro/retroRoom.interface";
import { RetroRoomPersistence } from "../domain/retro-room.persistence";
import { RetroGateway } from "./retro.gateway";

jest.mock("../../prisma/prisma.service", () => ({ PrismaService: class {} }));
jest.mock("shared/model/retro/ErrorTypes", () => ({ ErrorTypes: {} }), {
  virtual: true,
});

const columns: RetroColumn[] = [
  {
    id: "column",
    name: "Good",
    description: "",
    cards: [],
    teamCardsAmount: 0,
    isWriting: false,
  },
];

describe("retrospective votes", () => {
  let gateway: RetroGateway;
  let emit: jest.Mock;
  const client = { id: "socket-a" } as any;

  const setup = async () => {
    const database = {
      retrospective: { update: jest.fn(), findMany: jest.fn(async () => []) },
    };
    gateway = new RetroGateway(
      database as any,
      {} as any,
      new RetroRoomPersistence(database as any),
      {
        register: jest.fn(),
        unregister: jest.fn(),
        flushBroadcasts: jest.fn().mockResolvedValue(undefined),
      } as any,
    );
    emit = jest.fn();
    gateway.server = { to: () => ({ emit }) } as any;
    const room = await gateway.addRetroRoom("retro", "team", columns);
    room.cards = [
      {
        id: "card",
        text: "Card",
        authorId: "author",
        columnId: "column",
        parentCardId: null,
      },
    ];
    room.connectedUsers.set(client.id, {
      userId: "user-a",
      avatar_link: "",
      role: "USER",
      isReady: false,
      isCreatingTask: false,
      writingInColumns: new Set(),
    });
    gateway["users"].set(client.id, {
      roomId: "retro",
      userId: "user-a",
    } as any);
    return room;
  };

  it("does not remove another user's vote when the voter has none to remove", async () => {
    const room = await setup();
    room.changeState("vote");
    room.votes = [{ voterId: "user-b", parentCardId: "card" }];

    await gateway.handleRemoveVoteOnCard(client, { parentCardId: "missing" });

    expect(room.votes).toEqual([{ voterId: "user-b", parentCardId: "card" }]);
    expect(emit).not.toHaveBeenCalled();
  });

  it("removes only the caller's own vote", async () => {
    const room = await setup();
    room.changeState("vote");
    room.votes = [
      { voterId: "user-a", parentCardId: "card" },
      { voterId: "user-b", parentCardId: "card" },
    ];

    await gateway.handleRemoveVoteOnCard(client, { parentCardId: "card" });

    expect(room.votes).toEqual([{ voterId: "user-b", parentCardId: "card" }]);
  });

  it.each([
    "reflection",
    "group",
    "discuss",
  ] as const)("ignores vote commands in the %s stage", async (stage) => {
    const room = await setup();
    room.changeState(stage);
    room.votes = [{ voterId: "user-a", parentCardId: "card" }];

    await gateway.handleVoteOnCard(client, { parentCardId: "card" });
    await gateway.handleRemoveVoteOnCard(client, { parentCardId: "card" });

    expect(room.votes).toEqual([{ voterId: "user-a", parentCardId: "card" }]);
    expect(emit).not.toHaveBeenCalled();
  });

  it("accepts a vote in the vote stage", async () => {
    const room = await setup();
    room.changeState("vote");

    await gateway.handleVoteOnCard(client, { parentCardId: "card" });

    expect(room.votes).toEqual([{ voterId: "user-a", parentCardId: "card" }]);
  });
});
