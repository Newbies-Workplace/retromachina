import type { User as PrismaUser } from "generated/prisma/client";
import type { RetroColumn, User } from "shared/model/retro/retroRoom.interface";
import { RetroRoom } from "../domain/model/retroRoom.object";
import { RetroGateway } from "./retro.gateway";

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

describe("RetroGateway column editing", () => {
  const socket = { id: "socket-id" } as never;
  let gateway: RetroGateway;
  let room: RetroRoom;
  let emit: jest.Mock;

  beforeEach(() => {
    gateway = new RetroGateway({} as never, {} as never);
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
