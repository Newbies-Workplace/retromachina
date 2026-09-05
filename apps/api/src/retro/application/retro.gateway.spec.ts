import { RetroRoom } from "../domain/model/retroRoom.object";
import { RetroGateway } from "./retro.gateway";

jest.mock("../../prisma/prisma.service", () => ({ PrismaService: class {} }));
jest.mock("shared/model/retro/ErrorTypes", () => ({ ErrorTypes: {} }), {
  virtual: true,
});

describe("retrospective restart recovery", () => {
  const columns = [
    {
      id: "column",
      name: "Good",
      description: "",
      cards: [],
      isWriting: false,
      teamCardsAmount: 0,
    },
  ];
  let saved: unknown;
  let database: any;
  let gateway: RetroGateway;
  let emit: jest.Mock;

  beforeEach(() => {
    saved = null;
    database = {
      retrospective: {
        update: jest.fn(async ({ data }) => {
          if (data.room_state)
            saved = JSON.parse(JSON.stringify(data.room_state));
        }),
        findMany: jest.fn(async () => [
          { id: "retro", team_id: "team", room_state: saved },
        ]),
      },
    };
    gateway = new RetroGateway(database, {} as any);
    emit = jest.fn();
    gateway.server = { to: () => ({ emit }) } as any;
  });

  it("restores durable state into a new backend without restoring socket presence", async () => {
    const room = await gateway.addRetroRoom("retro", "team", columns);
    room.cards = [
      {
        id: "a",
        text: "Keep this",
        authorId: "user",
        columnId: "column",
        parentCardId: null,
      },
      {
        id: "b",
        text: "Grouped",
        authorId: "user",
        columnId: "column",
        parentCardId: "a",
      },
    ];
    room.changeState("discuss");
    room.timerEnds = Date.now() + 60000;
    room.votes = [{ voterId: "user", parentCardId: "a" }];
    room.maxVotes = 5;
    room.slotMachineVisible = true;
    room.highlightedUserId = "user";
    room.userIdsQueue.add("other");
    room.tasks = [
      {
        id: "task",
        description: "Follow up",
        owner_id: "user",
        parentCardId: "a",
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    ];
    await gateway["emitRoomSync"](room.id, room);

    const restarted = new RetroGateway(database, {} as any);
    await restarted.restoreRooms();
    const restored = restarted["retroRooms"].get("retro");
    expect(JSON.parse(JSON.stringify(restored.getSnapshot()))).toEqual(saved);
    expect(restored.connectedUsers.size).toBe(0);
    expect(restored.userIdsQueue).toEqual(new Set(["other"]));
    expect(restored.getRoomSyncData().tasks[0].parentCardId).toBe("a");
    expect(database.retrospective.findMany).toHaveBeenCalledWith({
      where: { is_running: true },
    });
  });

  it("serializes writes and only broadcasts persisted snapshots", async () => {
    const room = await gateway.addRetroRoom("retro", "team", columns);
    let release: () => void;
    database.retrospective.update.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    room.maxVotes = 4;
    const first = gateway["emitRoomSync"](room.id, room);
    room.maxVotes = 6;
    const second = gateway["emitRoomSync"](room.id, room);
    await new Promise(setImmediate);
    expect(emit).not.toHaveBeenCalled();
    expect(database.retrospective.update).toHaveBeenCalledTimes(2);
    release();
    await Promise.all([first, second]);
    expect(emit.mock.calls.map((call) => call[1].maxVotes)).toEqual([4, 6]);
    expect((saved as any).maxVotes).toBe(6);
  });

  it("does not broadcast when saving fails", async () => {
    const room = new RetroRoom("retro", "team", columns);
    database.retrospective.update.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );
    await expect(gateway["emitRoomSync"](room.id, room)).rejects.toThrow(
      "Database unavailable",
    );
    expect(emit).not.toHaveBeenCalled();
  });
});
