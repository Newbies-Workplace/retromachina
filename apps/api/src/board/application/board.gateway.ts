import { Injectable, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Task } from "generated/prisma/client";
import {
  TaskCreateCommand,
  TaskDeleteCommand,
  TaskUpdateCommand,
} from "shared/model/board/board.commands";
import {
  BoardSyncEvent,
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskUpdatedEvent,
} from "shared/model/board/board.events";
import { ErrorTypes } from "shared/model/retro/ErrorTypes";
import type { UserRole } from "shared/model/user/user.role";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../../prisma/prisma.service";
import { TeamSocketGuard } from "../../security/team-socket.guard";
import { TeamSocketAccessService } from "../../security/team-socket-access.service";

@Injectable()
@UseGuards(TeamSocketGuard)
@WebSocketGateway(3001, { cors: true, namespace: "board" })
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users = new Map<
    string,
    {
      teamId: string;
      user: {
        id: string;
        avatar_link: string;
        role: UserRole;
      };
    }
  >();

  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private accessService: TeamSocketAccessService,
  ) {}

  async handleConnection(client: Socket) {
    const teamId = client.handshake.query.team_id;
    if (typeof teamId !== "string" || teamId.trim().length === 0) {
      this.doException(client, ErrorTypes.Unauthorized, "Invalid team");
      return;
    }
    const user = this.getUserFromJWT(client);
    if (!user?.id) return;

    const userQuery = await this.prismaService.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        TeamUsers: {
          where: {
            team_id: teamId,
          },
        },
      },
    });

    if (!userQuery) {
      this.doException(
        client,
        ErrorTypes.UserNotFound,
        `User (${user.id}) not found`,
      );
      return;
    }

    if (userQuery.TeamUsers.length === 0) {
      this.doException(
        client,
        ErrorTypes.Unauthorized,
        `User (${user.id}) is not in team (${teamId})`,
      );
      return;
    }

    const userRole = userQuery.TeamUsers.at(0).role;

    this.users.set(client.id, {
      user: {
        id: userQuery.id,
        avatar_link: userQuery.avatar_link,
        role: userRole,
      },
      teamId: teamId,
    });

    this.accessService.register(client, teamId, userQuery.id, (role) => {
      const connectedUser = this.users.get(client.id);
      if (connectedUser) connectedUser.user.role = role as UserRole;
    });
    try {
      await this.accessService.authorize(client);
    } catch {
      this.doException(client, ErrorTypes.Unauthorized, "Team access denied");
      return;
    }

    client.join(teamId);

    this.emitBoardSync(teamId);
  }

  @SubscribeMessage("command_create_task")
  async handleCreateTask(client: Socket, payload: TaskCreateCommand) {
    const context = this.getTaskCommandContext(client, [
      payload?.taskId,
      payload?.columnId,
    ]);
    if (
      !context ||
      !(await this.validateOwner(context.teamId, payload?.ownerId)) ||
      !(await this.columnBelongsToTeam(context.teamId, payload?.columnId))
    ) {
      this.rejectTaskCommand(client);
      return;
    }
    let task: Task;
    try {
      task = await this.prismaService.task.create({
        data: {
          id: payload.taskId,
          column_id: payload.columnId,
          owner_id: payload.ownerId,
          team_id: context.teamId,
          description: payload.text,
        },
      });
    } catch {
      // A duplicate client supplied ID is reported without exposing database details.
      this.rejectTaskCommand(client);
      return;
    }

    const event: TaskCreatedEvent = {
      taskId: task.id,
      columnId: task.column_id,
      ownerId: task.owner_id,
      text: task.description,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };

    this.server.to(context.teamId).emit("task_created_event", event);
  }

  @SubscribeMessage("command_update_task")
  async handleUpdateTask(client: Socket, payload: TaskUpdateCommand) {
    const context = this.getTaskCommandContext(client, [payload?.taskId]);
    if (
      !context ||
      (payload?.ownerId !== undefined &&
        !(await this.validateOwner(context.teamId, payload.ownerId))) ||
      (payload?.columnId !== undefined &&
        !(await this.columnBelongsToTeam(context.teamId, payload.columnId)))
    ) {
      this.rejectTaskCommand(client);
      return;
    }
    let task: Task;
    try {
      task = await this.prismaService.task.update({
        data: {
          column_id: payload.columnId,
          owner_id: payload.ownerId,
          description: payload.text,
        },
        where: { id: payload.taskId, team_id: context.teamId },
      });
    } catch {
      this.rejectTaskCommand(client);
      return;
    }

    const event: TaskUpdatedEvent = {
      taskId: task.id,
      columnId: task.column_id,
      ownerId: task.owner_id,
      text: task.description,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };

    this.server.to(context.teamId).emit("task_updated_event", event);
  }

  @SubscribeMessage("command_delete_task")
  async handleDeleteTask(client: Socket, payload: TaskDeleteCommand) {
    const context = this.getTaskCommandContext(client, [payload?.taskId]);
    if (!context) {
      this.rejectTaskCommand(client);
      return;
    }
    let task: Task;
    try {
      task = await this.prismaService.task.delete({
        where: { id: payload.taskId, team_id: context.teamId },
      });
    } catch {
      this.rejectTaskCommand(client);
      return;
    }

    const event: TaskDeletedEvent = {
      taskId: task.id,
    };

    this.server.to(context.teamId).emit("task_deleted_event", event);
  }

  handleDisconnect(client: Socket) {
    this.accessService.unregister(client);
    const user = this.users.get(client.id);
    if (!user) {
      return;
    }

    this.users.delete(client.id);
    this.emitBoardSync(user.teamId);
  }

  private emitBoardSync(teamId: string) {
    const activeUsersMap = new Map(
      Array.from(this.users.values())
        .filter((entry) => entry.teamId === teamId)
        .map((entry) => [
          entry.user.id,
          {
            userId: entry.user.id,
            avatar_link: entry.user.avatar_link,
            role: entry.user.role,
          },
        ]),
    );

    const event: BoardSyncEvent = {
      users: Array.from(activeUsersMap.values()),
    };

    this.server.to(teamId).emit("event_board_sync", event);
  }

  private doException(client: Socket, type: ErrorTypes, message: string) {
    this.accessService.unregister(client);
    this.users.delete(client.id);

    client.emit("error", {
      type,
      message,
    });
    client.disconnect();
  }

  private getUserFromJWT(client: Socket) {
    try {
      const result = this.jwtService.verify(
        client.handshake.headers.authorization,
        { secret: process.env.JWT_SECRET },
      );
      return result.user;
    } catch {
      this.doException(client, ErrorTypes.JwtError, "JWT must be provided!");
      return null;
    }
  }

  private getTaskCommandContext(client: Socket, ids: unknown[]) {
    const entry = this.users.get(client.id);
    if (
      !entry ||
      ids.some((id) => typeof id !== "string" || id.trim().length === 0)
    )
      return null;
    return entry;
  }

  private async validateOwner(teamId: string, ownerId: unknown) {
    if (ownerId === null) return true;
    if (typeof ownerId !== "string" || ownerId.trim().length === 0)
      return false;
    try {
      return !!(await this.prismaService.teamUsers.findFirst({
        where: { team_id: teamId, user_id: ownerId },
        select: { user_id: true },
      }));
    } catch {
      return false;
    }
  }

  private async columnBelongsToTeam(teamId: string, columnId: unknown) {
    if (typeof columnId !== "string" || columnId.trim().length === 0)
      return false;
    try {
      return !!(await this.prismaService.boardColumn.findFirst({
        where: { id: columnId, team_id: teamId },
        select: { id: true },
      }));
    } catch {
      return false;
    }
  }

  private rejectTaskCommand(client: Socket) {
    client.emit("error", {
      type: ErrorTypes.Unauthorized,
      message: "Task command rejected",
    });
  }
}
