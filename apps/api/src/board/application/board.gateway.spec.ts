import { BoardGateway } from "./board.gateway";

jest.mock("../../prisma/prisma.service", () => ({ PrismaService: class {} }));

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "task-id",
  column_id: "column-id",
  owner_id: null,
  description: "task text",
  created_at: new Date("2025-01-01T00:00:00Z"),
  updated_at: new Date("2025-01-01T00:00:00Z"),
  ...overrides,
});

describe("BoardGateway task authorization", () => {
  const client = {
    id: "socket-id",
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as any;
  let gateway: BoardGateway;
  let database: any;
  let emit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    database = {
      teamUsers: { findFirst: jest.fn(async () => ({ user_id: "owner-id" })) },
      boardColumn: { findFirst: jest.fn(async () => ({ id: "column-id" })) },
      task: {
        create: jest.fn(async () => row()),
        update: jest.fn(async ({ where }) => {
          if (where.team_id !== "team-id") throw new Error("missing");
          return row({ id: where.id });
        }),
        delete: jest.fn(async ({ where }) => {
          if (where.team_id !== "team-id") throw new Error("missing");
          return row({ id: where.id });
        }),
      },
    };
    gateway = new BoardGateway(
      database,
      {} as any,
      {
        register: jest.fn(),
        unregister: jest.fn(),
        authorize: jest.fn(),
      } as any,
    );
    (gateway as any).users.set(client.id, {
      teamId: "team-id",
      user: { id: "actor-id", avatar_link: "", role: "USER" },
    });
    emit = jest.fn();
    gateway.server = { to: jest.fn(() => ({ emit })) } as any;
  });

  it("creates an own-team task with an unassigned owner", async () => {
    await gateway.handleCreateTask(client, {
      taskId: "new-task",
      columnId: "column-id",
      ownerId: null,
      text: "new task",
    });

    expect(database.task.create).toHaveBeenCalledWith({
      data: {
        id: "new-task",
        column_id: "column-id",
        owner_id: null,
        team_id: "team-id",
        description: "new task",
      },
    });
    expect(emit).toHaveBeenCalledWith(
      "task_created_event",
      expect.objectContaining({ taskId: "task-id" }),
    );
  });

  it.each([
    ["foreign column", "other-column", null],
    ["foreign owner", "column-id", "other-owner"],
  ])("rejects a create with a %s before writing", async (_name, columnId, ownerId) => {
    if (columnId === "other-column")
      database.boardColumn.findFirst.mockResolvedValue(null);
    if (ownerId === "other-owner")
      database.teamUsers.findFirst.mockResolvedValue(null);

    await gateway.handleCreateTask(client, {
      taskId: "new-task",
      columnId,
      ownerId,
      text: "new task",
    });

    expect(database.task.create).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith("error", {
      type: expect.anything(),
      message: "Task command rejected",
    });
  });

  it("rejects empty IDs before any task operation", async () => {
    await gateway.handleDeleteTask(client, { taskId: " " });
    expect(database.task.delete).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalled();
  });

  it("uses atomic team scope for update and permits a same-team retrospective task", async () => {
    await gateway.handleUpdateTask(client, {
      taskId: "retro-action-point",
      text: "updated",
    });

    expect(database.task.update).toHaveBeenCalledWith({
      data: {
        column_id: undefined,
        owner_id: undefined,
        description: "updated",
      },
      where: { id: "retro-action-point", team_id: "team-id" },
    });
    expect(emit).toHaveBeenCalledWith(
      "task_updated_event",
      expect.objectContaining({ taskId: "retro-action-point" }),
    );
  });

  it("uses atomic team scope for delete and hides an inaccessible task", async () => {
    database.task.delete.mockImplementationOnce(async () => {
      throw new Error("not found");
    });
    await gateway.handleDeleteTask(client, { taskId: "foreign-task" });

    expect(database.task.delete).toHaveBeenCalledWith({
      where: { id: "foreign-task", team_id: "team-id" },
    });
    expect(emit).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith(
      "error",
      expect.objectContaining({ message: "Task command rejected" }),
    );
  });
});
