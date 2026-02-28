import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { User } from "generated/prisma/client";
import {
  TaskCreateCommand,
  TaskDeleteCommand,
  TaskUpdateCommand,
} from "shared/model/board/board.commands";
import {
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskUpdatedEvent,
} from "shared/model/board/board.events";
import { ErrorTypes } from "shared/model/retro/ErrorTypes";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
@WebSocketGateway(3001, { cors: true, namespace: "board" })
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users = new Map<string, { teamId: string; user: User }>();

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

    this.users.set(client.id, {
      user: userQuery,
      teamId: teamId,
    });

    client.join(teamId);
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
    this.users.delete(client.id);
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
