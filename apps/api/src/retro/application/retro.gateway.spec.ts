import type { User as PrismaUser } from "generated/prisma/client";
import type { RetroColumn, User } from "shared/model/retro/retroRoom.interface";
import { RetroRoom } from "../domain/model/retroRoom.object";
import { RetroRoomPersistence } from "../domain/retro-room.persistence";
import { RetroGateway } from "./retro.gateway";

jest.mock("../../prisma/prisma.service", () => ({ PrismaService: class {} }));
jest.mock("shared/model/retro/ErrorTypes", () => ({ ErrorTypes: {} }), {
  virtual: true,
});

const createColumn = (id: string, name = id): RetroColumn => ({
  id,
  name,
  description: "",
  cards: [],
  teamCardsAmount: 0,
  isWriting: false,
});

const createRoomUser = (role: User["role"]): User => ({
  userId: "user-id",
  avatar_link: "",
  role,
  isReady: false,
  isCreatingTask: false,
  writingInColumns: new Set(),
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
  let persistence: RetroRoomPersistence;
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
    persistence = new RetroRoomPersistence(database);
    gateway = new RetroGateway(database, {} as any, persistence);
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
    expect(typeof room.getSnapshot().tasks[0].created_at).toBe("string");
    expect(typeof room.getSnapshot().tasks[0].updated_at).toBe("string");
    await gateway["emitRoomSync"](room.id, room);

    const restarted = new RetroGateway(
      database,
      {} as any,
      new RetroRoomPersistence(database),
    );
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

  it("marks missing and corrupted snapshots as not running and restores the others", async () => {
    const validRoom = new RetroRoom("valid", "team", columns);
    database.retrospective.findMany.mockResolvedValueOnce([
      { id: "missing", team_id: "team", room_state: null },
      { id: "corrupted", team_id: "team", room_state: { version: 999 } },
      {
        id: "valid",
        team_id: "team",
        room_state: validRoom.getSnapshot(),
      },
    ]);

    await gateway.restoreRooms();

    expect(gateway["retroRooms"].has("missing")).toBe(false);
    expect(gateway["retroRooms"].has("corrupted")).toBe(false);
    expect(gateway["retroRooms"].has("valid")).toBe(true);
    expect(database.retrospective.update).toHaveBeenCalledWith({
      where: { id: "missing" },
      data: { is_running: false },
    });
    expect(database.retrospective.update).toHaveBeenCalledWith({
      where: { id: "corrupted" },
      data: { is_running: false },
    });
  });

  it("closes a room after its pending persistence write failed", async () => {
    const room = new RetroRoom("retro", "team", columns);
    gateway["retroRooms"].set(room.id, room);
    persistence["pendingWrites"].set(
      room.id,
      Promise.reject(new Error("Database unavailable")),
    );
    const disconnectSockets = jest.fn();
    gateway.server = {
      to: () => ({ emit, disconnectSockets }),
    } as any;

    await gateway.closeRoom(room);

    expect(database.retrospective.update).toHaveBeenCalledWith({
      where: { id: room.id },
      data: { is_running: false },
    });
    expect(gateway["retroRooms"].has(room.id)).toBe(false);
    expect(disconnectSockets).toHaveBeenCalledWith(true);
  });
});

describe("RetroGateway column editing", () => {
  const socket = { id: "socket-id" } as never;
  let gateway: RetroGateway;
  let room: RetroRoom;
  let emit: jest.Mock;

  beforeEach(() => {
    gateway = new RetroGateway({} as never, {} as never, {} as never);
    room = new RetroRoom("retro-id", "team-id", [
      createColumn("first"),
      createColumn("second"),
    ]);
    emit = jest.fn();
    gateway.server = { to: jest.fn(() => ({ emit })) } as never;

    const internals = gateway as unknown as {
      users: Map<string, { roomId: string; teamId: string; user: PrismaUser }>;
      retroRooms: Map<string, RetroRoom>;
    };
    internals.users.set("socket-id", {
      roomId: room.id,
      teamId: room.teamId,
      user: { id: "user-id" } as PrismaUser,
    });
    internals.retroRooms.set(room.id, room);
  });

  const connectAs = (role: User["role"]) => {
    room.connectedUsers.set("socket-id", createRoomUser(role));
  };

  it.each([
    "ADMIN",
    "OWNER",
  ] as const)("changes a column name for %s and emits only its dedicated event", (role) => {
    connectAs(role);

    gateway.handleChangeColumnName(socket, {
      columnId: "first",
      name: `  ${"x".repeat(40)}  `,
    });

    expect(room.retroColumns[0].name).toBe("x".repeat(40));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith("event_column_name_changed", {
      columnId: "first",
      name: "x".repeat(40),
    });
    expect(emit).not.toHaveBeenCalledWith("event_room_sync", expect.anything());
  });

  it("changes and limits a column description", () => {
    connectAs("ADMIN");

    gateway.handleChangeColumnDescription(socket, {
      columnId: "first",
      description: `  ${"x".repeat(1100)}  `,
    });

    expect(room.retroColumns[0].description).toHaveLength(1000);
    expect(emit).toHaveBeenCalledWith(
      "event_column_description_changed",
      expect.objectContaining({ columnId: "first" }),
    );
  });

  it("reorders columns and emits the authoritative order", () => {
    connectAs("OWNER");

    gateway.handleReorderColumns(socket, {
      fromColumnId: "first",
      toColumnId: "second",
    });

    expect(room.retroColumns.map((column) => column.id)).toEqual([
      "second",
      "first",
    ]);
    expect(emit).toHaveBeenCalledWith("event_columns_reordered", {
      columnIds: ["second", "first"],
    });
  });

  it.each(["USER"] as const)("rejects column changes for %s", (role) => {
    connectAs(role);
    gateway.handleChangeColumnName(socket, {
      columnId: "first",
      name: "changed",
    });

    expect(room.retroColumns[0].name).toBe("first");
    expect(emit).not.toHaveBeenCalled();
  });

  it.each([
    "group",
    "vote",
    "discuss",
  ] as const)("rejects column changes during %s", (roomState) => {
    connectAs("ADMIN");
    room.roomState = roomState;
    gateway.handleChangeColumnDescription(socket, {
      columnId: "first",
      description: "changed",
    });

    expect(room.retroColumns[0].description).toBe("");
    expect(emit).not.toHaveBeenCalled();
  });

  it("rejects empty names and invalid column ids", () => {
    connectAs("ADMIN");

    gateway.handleChangeColumnName(socket, { columnId: "first", name: "   " });
    gateway.handleChangeColumnDescription(socket, {
      columnId: "missing",
      description: "changed",
    });
    gateway.handleReorderColumns(socket, {
      fromColumnId: "first",
      toColumnId: "missing",
    });

    expect(room.retroColumns[0].name).toBe("first");
    expect(emit).not.toHaveBeenCalled();
  });
});
