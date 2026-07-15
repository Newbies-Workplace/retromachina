import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
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

@Injectable()
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
  ) {}

  async handleConnection(client: Socket) {
    const teamId = client.handshake.query.team_id as string;
    const user = this.getUserFromJWT(client);

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

    client.join(teamId);

    this.emitBoardSync(teamId);
  }

  @SubscribeMessage("command_create_task")
  async handleCreateTask(client: Socket, payload: TaskCreateCommand) {
    const teamId = this.users.get(client.id).teamId;
    const task = await this.prismaService.task.create({
      data: {
        id: payload.taskId,
        Column: {
          connect: {
            id: payload.columnId,
          },
        },
        User: {
          connect: {
            id: payload.ownerId,
          },
        },
        Board: {
          connect: {
            team_id: teamId,
          },
        },
        description: payload.text,
      },
    });

    const event: TaskCreatedEvent = {
      taskId: task.id,
      columnId: task.column_id,
      ownerId: task.owner_id,
      text: task.description,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };

    this.server.to(teamId).emit("task_created_event", event);
  }

  @SubscribeMessage("command_update_task")
  async handleUpdateTask(client: Socket, payload: TaskUpdateCommand) {
    const teamId = this.users.get(client.id).teamId;
    const task = await this.prismaService.task.update({
      data: {
        column_id: payload.columnId,
        owner_id: payload.ownerId,
        description: payload.text,
      },
      where: {
        id: payload.taskId,
      },
    });

    const event: TaskUpdatedEvent = {
      taskId: task.id,
      columnId: task.column_id,
      ownerId: task.owner_id,
      text: task.description,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };

    this.server.to(teamId).emit("task_updated_event", event);
  }

  @SubscribeMessage("command_delete_task")
  async handleDeleteTask(client: Socket, payload: TaskDeleteCommand) {
    const teamId = this.users.get(client.id).teamId;
    const task = await this.prismaService.task.delete({
      where: {
        id: payload.taskId,
      },
    });

    const event: TaskDeletedEvent = {
      taskId: task.id,
    };

    this.server.to(teamId).emit("task_deleted_event", event);
  }

  handleDisconnect(client: Socket) {
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
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        this.doException(client, ErrorTypes.JwtError, "JWT must be provided!");
      }
    }
  }
}
