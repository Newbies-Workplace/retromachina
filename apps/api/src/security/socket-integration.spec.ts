import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { PORT_METADATA } from "@nestjs/websockets/constants";
import { io, type Socket } from "socket.io-client";
import { AccessTokenService } from "../auth/session/access-token.service";
import { BoardGateway } from "../board/application/board.gateway";
import { PokerGateway } from "../poker/application/poker.gateway";
import { PrismaService } from "../prisma/prisma.service";
import { RetroGateway } from "../retro/application/retro.gateway";
import { RetroRoomPersistence } from "../retro/domain/retro-room.persistence";
import { SecurityModule } from "./security.module";
import { TeamSocketAccessService } from "./team-socket-access.service";

jest.mock("../prisma/prisma.service", () => ({ PrismaService: class {} }));
jest.mock("shared/model/retro/ErrorTypes", () => ({ ErrorTypes: {} }), {
  virtual: true,
});

type Role = "ADMIN" | "USER" | "OWNER";
const once = <T>(socket: Socket, event: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(event, listener);
      reject(new Error(`Timed out waiting for ${event}`));
    }, 3000);
    const listener = (value: T) => {
      clearTimeout(timeout);
      resolve(value);
    };
    socket.once(event, listener);
  });

describe("team authorization through real Socket.IO gateways", () => {
  let app: INestApplication;
  let baseUrl: string;
  let access: TeamSocketAccessService;
  let memberships: Map<string, Role>;
  let clients: Socket[];
  const task = {
    id: "task-a",
    team_id: "team-a",
    retro_id: null,
    column_id: "column-a",
    owner_id: null,
    description: "Original",
    created_at: new Date(),
    updated_at: new Date(),
  };
  const prisma = {
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    teamUsers: { findUnique: jest.fn(), findFirst: jest.fn() },
    boardColumn: { findFirst: jest.fn() },
    task: { update: jest.fn(), delete: jest.fn(), create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    clients = [];
    memberships = new Map([
      ["team-a:user-a", "ADMIN"],
      ["team-b:user-a", "USER"],
    ]);
    const lookupUser = ({ where, include }) => {
      const id = where.id ?? "user-a";
      const role = memberships.get(`${include.TeamUsers.where.team_id}:${id}`);
      return {
        id,
        google_id: id,
        nick: "Member",
        avatar_link: "",
        TeamUsers: role ? [{ role }] : [],
      };
    };
    prisma.user.findUnique.mockImplementation(lookupUser);
    prisma.user.findFirst.mockImplementation(lookupUser);
    prisma.teamUsers.findUnique.mockImplementation(({ where }) => {
      const key = where.team_id_user_id;
      const role = memberships.get(`${key.team_id}:${key.user_id}`);
      return role ? { role } : null;
    });
    prisma.teamUsers.findFirst.mockImplementation(({ where }) =>
      memberships.has(`${where.team_id}:${where.user_id}`)
        ? { user_id: where.user_id }
        : null,
    );
    prisma.boardColumn.findFirst.mockImplementation(({ where }) =>
      where.id === `column-${where.team_id.slice(-1)}`
        ? { id: where.id }
        : null,
    );
    prisma.task.update.mockImplementation(({ where, data }) => {
      if (where.id !== task.id || where.team_id !== task.team_id)
        throw new Error("No matching task");
      return { ...task, ...data };
    });
    const gateways = [BoardGateway, RetroGateway, PokerGateway];
    for (const gateway of gateways)
      Reflect.defineMetadata(PORT_METADATA, 0, gateway);
    const module = await Test.createTestingModule({
      imports: [SecurityModule],
      providers: [
        ...gateways,
        {
          provide: AccessTokenService,
          useValue: {
            assertSession: jest.fn().mockResolvedValue(undefined),
            validateClaims: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: () => ({
              exp: Math.floor(Date.now() / 1000) + 900,
              sid: "session",
              user: { id: "user-a", google_id: "user-a" },
            }),
          },
        },
        {
          provide: RetroRoomPersistence,
          useValue: {
            persist: jest.fn().mockResolvedValue(undefined),
            markFinished: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideProvider(AccessTokenService)
      .useValue({
        assertSession: jest.fn().mockResolvedValue(undefined),
        validateClaims: jest.fn(),
      })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    access = app.get(TeamSocketAccessService);
    await app.get(RetroGateway).addRetroRoom("retro-a", "team-a", [
      {
        id: "one",
        name: "One",
        description: "",
        cards: [],
        teamCardsAmount: 0,
        isWriting: false,
      },
      {
        id: "two",
        name: "Two",
        description: "",
        cards: [],
        teamCardsAmount: 0,
        isWriting: false,
      },
    ]);
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterEach(async () => {
    for (const client of clients) client.disconnect();
    await app?.close();
    for (const gateway of [BoardGateway, RetroGateway, PokerGateway])
      Reflect.defineMetadata(PORT_METADATA, 3001, gateway);
  });

  const connect = async (
    namespace: string,
    team = "team-a",
    forceNew = true,
  ) => {
    const socket = io(`${baseUrl}/${namespace}`, {
      autoConnect: false,
      reconnection: false,
      forceNew,
      transports: ["websocket"],
      extraHeaders: { Authorization: "synthetic-token" },
      query: { retro_id: "retro-a", team_id: team },
    });
    clients.push(socket);
    const ready = once(
      socket,
      {
        board: "event_board_sync",
        poker: "event_poker_sync",
        retro: "event_room_sync",
      }[namespace],
    );
    socket.connect();
    await ready;
    return socket;
  };

  it.each([
    "board",
    "retro",
    "poker",
  ])("disconnects revoked %s recipients before sending a room broadcast", async (namespace) => {
    const socket = await connect(namespace);
    const event = jest.fn();
    socket.on("revoked-broadcast", event);
    app.get(AccessTokenService).assertSession = jest
      .fn()
      .mockRejectedValue(new Error("session revoked"));
    const disconnected = once(socket, "disconnect");
    const gateway = app.get(
      { board: BoardGateway, retro: RetroGateway, poker: PokerGateway }[
        namespace
      ],
    );
    gateway.server.emit("revoked-broadcast", { private: true });
    await disconnected;
    expect(event).not.toHaveBeenCalled();
  });

  it("delivers close_room before disconnecting its authorized recipients", async () => {
    const socket = await connect("retro");
    const closing = once(socket, "event_close_room");
    const gateway = app.get(RetroGateway);
    await gateway.closeRoom(gateway["retroRooms"].get("retro-a"));
    await closing;
  });

  it.each([
    "board",
    "poker",
    "retro",
  ])("rejects the next %s command after membership disappears", async (namespace) => {
    const socket = await connect(namespace);
    memberships.delete("team-a:user-a");
    const disconnected = once(socket, "disconnect");
    const commands = {
      board: ["command_delete_task", { taskId: "task-a" }],
      poker: ["command_select_card", { card: "1" }],
      retro: ["command_delete_action_point", { taskId: "task-a" }],
    };
    const [command, payload] = commands[namespace];
    socket.emit(command as string, payload);
    await disconnected;
    expect(prisma.task.delete).not.toHaveBeenCalled();
  });

  it("rejects a foreign-team task through the Board event boundary and accepts an own task", async () => {
    const foreign = await connect("board", "team-b");
    const rejected = once(foreign, "error");
    foreign.emit("command_update_task", {
      taskId: "task-a",
      columnId: "column-b",
      ownerId: null,
      text: "Attack",
    });
    await rejected;
    expect(prisma.task.update.mock.results.at(-1).type).toBe("throw");
    const own = await connect("board");
    const updated = once<{ text: string }>(own, "task_updated_event");
    own.emit("command_update_task", {
      taskId: "task-a",
      columnId: "column-a",
      ownerId: null,
      text: "Allowed",
    });
    expect((await updated).text).toBe("Allowed");
  });

  it("refreshes a downgraded role before an admin-only Retro command", async () => {
    const socket = await connect("retro");
    const rooms = app.get(RetroGateway)["retroRooms"];
    const room = rooms.get("retro-a");
    const original = room.maxVotes;
    memberships.set("team-a:user-a", "USER");
    // A following ready event proves that the preceding command has run through the guard.
    const synced = once(socket, "event_room_sync");
    socket.emit("command_change_vote_amount", { votesAmount: 1 });
    socket.emit("command_ready", { readyState: true });
    await synced;
    expect(room.maxVotes).toBe(original);
    expect(room.connectedUsers.get(socket.id).role).toBe("USER");
  });

  it("revokes all three namespaces while preserving another team on the same transport", async () => {
    // Query parameters belong to the shared Engine.IO transport. Retro uses
    // retro_id (team-a), while Board/Poker use team_id (team-b).
    const retro = await connect("retro", "team-b", false);
    const board = await connect("board", "team-b", false);
    const poker = await connect("poker", "team-b", false);
    expect(retro.io).toBe(poker.io);
    expect(board.io).toBe(poker.io);
    // A second Board session proves every session is revoked, beyond one multiplexed transport.
    const secondBoard = await connect("board");
    const teamPoker = await connect("poker");
    const disconnected = [retro, secondBoard, teamPoker].map((socket) =>
      once(socket, "disconnect"),
    );
    access.revokeUser("team-a", "user-a");
    await Promise.all(disconnected);
    const synced = once<{ users: { selectedCard: string }[] }>(
      poker,
      "event_poker_sync",
    );
    poker.emit("command_select_card", { card: "1" });
    expect((await synced).users[0].selectedCard).toBe("1");
    expect(poker.connected).toBe(true);
  });
  const room = () => app.get(RetroGateway)["retroRooms"].get("retro-a");
  const seedCards = () => {
    room().cards = [
      {
        id: "a",
        text: "A",
        authorId: "user-a",
        columnId: "one",
        parentCardId: null,
      },
      {
        id: "b",
        text: "B",
        authorId: "user-a",
        columnId: "one",
        parentCardId: null,
      },
    ];
  };
  const barrier = async (socket: Socket) => {
    const synced = once(socket, "event_room_sync");
    socket.emit("command_ready", {
      readyState: !room().connectedUsers.get(socket.id).isReady,
    });
    await synced;
  };

  it("rejects USER stage/timer changes and skipped stages without changing persistent state", async () => {
    seedCards();
    const socket = await connect("retro");
    const before = JSON.stringify(room().getSnapshot());
    memberships.set("team-a:user-a", "USER");
    socket.emit("command_room_state", { roomState: "group" });
    socket.emit("command_timer_change", { timestamp: Date.now() + 60000 });
    await barrier(socket);
    expect(JSON.stringify(room().getSnapshot())).toBe(before);
    memberships.set("team-a:user-a", "ADMIN");
    socket.emit("command_room_state", { roomState: "summary" });
    socket.emit("command_room_state", { roomState: "discuss" });
    await barrier(socket);
    expect(JSON.stringify(room().getSnapshot())).toBe(before);
  });

  it.each([
    "ADMIN",
    "OWNER",
  ] as const)("allows adjacent stages and timer start/clear for %s", async (role) => {
    seedCards();
    memberships.set("team-a:user-a", role);
    const socket = await connect("retro");
    let synced = once<{ roomState: string }>(socket, "event_room_sync");
    socket.emit("command_room_state", { roomState: "group" });
    expect((await synced).roomState).toBe("group");
    const timestamp = Date.now() + 60000;
    let timer = once<{ timerEnds: number | null }>(
      socket,
      "event_timer_change",
    );
    socket.emit("command_timer_change", { timestamp });
    expect((await timer).timerEnds).toBe(timestamp);
    timer = once(socket, "event_timer_change");
    socket.emit("command_timer_change", { timestamp: null });
    expect((await timer).timerEnds).toBeNull();
    synced = once(socket, "event_room_sync");
    socket.emit("command_room_state", { roomState: "reflection" });
    expect((await synced).roomState).toBe("reflection");
  });

  it.each([
    ["command_create_card", null],
    ["command_ready", { readyState: "yes" }],
    ["command_timer_change", { timestamp: -1 }],
    ["command_timer_change", { timestamp: "tomorrow" }],
    ["command_change_vote_amount", { votesAmount: 2.5 }],
    ["command_change_column_name", { columnId: "one", name: {} }],
    ["command_change_discussion_card", { cardId: [] }],
    ["command_creating_task_state", []],
  ])("rejects malformed %s with safe errors and no state change", async (command, payload) => {
    seedCards();
    const socket = await connect("retro");
    const before = JSON.stringify(room().getSnapshot());
    const rejected = once<{ status: string; message: string }>(
      socket,
      "exception",
    );
    socket.emit(command as string, payload);
    expect(await rejected).toEqual({
      status: "error",
      message: "Command rejected",
    });
    expect(JSON.stringify(room().getSnapshot())).toBe(before);
    expect(socket.connected).toBe(true);
    await barrier(socket);
  });

  it("rejects unknown cards/columns and invalid grouping relations without mutation", async () => {
    seedCards();
    const socket = await connect("retro");
    const before = JSON.stringify(room().getSnapshot());
    socket.emit("command_move_card_to_column", {
      cardId: "missing",
      columnId: "one",
    });
    socket.emit("command_move_card_to_column", {
      cardId: "a",
      columnId: "missing",
    });
    socket.emit("command_card_add_to_card", {
      cardId: "a",
      parentCardId: "missing",
    });
    socket.emit("command_card_add_to_card", { cardId: "a", parentCardId: "a" });
    socket.emit("command_change_discussion_card", { cardId: "missing" });
    await barrier(socket);
    expect(JSON.stringify(room().getSnapshot())).toBe(before);
    const grouped = once(socket, "event_room_sync");
    socket.emit("command_card_add_to_card", { cardId: "b", parentCardId: "a" });
    await grouped;
    expect(room().cards.find((card) => card.id === "b").parentCardId).toBe("a");
    const moved = once(socket, "event_room_sync");
    socket.emit("command_move_card_to_column", {
      cardId: "a",
      columnId: "two",
    });
    await moved;
    expect(room().cards.every((card) => card.columnId === "two")).toBe(true);
  });

  it("copies only trusted card fields and allows clearing a column description", async () => {
    const socket = await connect("retro");
    const created = once(socket, "event_room_sync");
    socket.emit("command_create_card", {
      id: "client-id",
      columnId: "one",
      text: "Card",
      authorId: "other",
      parentCardId: "missing",
      dangerous: true,
    });
    await created;
    expect(room().cards[0]).toEqual({
      id: expect.any(String),
      columnId: "one",
      text: "Card",
      authorId: "user-a",
      parentCardId: null,
    });
    expect(room().cards[0].id).not.toBe("client-id");
    const changed = once(socket, "event_column_description_changed");
    socket.emit("command_change_column_description", {
      columnId: "one",
      description: "",
    });
    await changed;
    expect(room().retroColumns[0].description).toBe("");
  });
  it("preserves clearing an action-point description and updating its owner afterward", async () => {
    const socket = await connect("retro");
    const stored = { ...task, retro_id: "retro-a", parentCardId: null };
    room().tasks = [stored];
    prisma.task.update.mockResolvedValueOnce({ ...stored, description: "" });
    let synced = once(socket, "event_room_sync");
    socket.emit("command_update_action_point", {
      taskId: task.id,
      description: "",
      ownerId: null,
    });
    await synced;
    expect(room().tasks[0].description).toBe("");
    prisma.task.update.mockResolvedValueOnce({
      ...stored,
      description: "",
      owner_id: "user-a",
    });
    synced = once(socket, "event_room_sync");
    socket.emit("command_update_action_point", {
      taskId: task.id,
      description: "",
      ownerId: "user-a",
    });
    await synced;
    expect(room().tasks[0].owner_id).toBe("user-a");
  });
});
