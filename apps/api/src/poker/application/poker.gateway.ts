import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type {
  SelectPokerCardCommand,
  SelectPokerDeckCommand,
} from "shared/model/poker/poker.commands";
import { ErrorTypes } from "shared/model/retro/ErrorTypes";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../../prisma/prisma.service";
import { PokerRoom } from "../domain/model/pokerRoom.object";

type ConnectedUser = {
  roomId: string;
  userId: string;
};

@Injectable()
@WebSocketGateway(3001, { cors: true, namespace: "poker" })
export class PokerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly users = new Map<string, ConnectedUser>();
  private readonly rooms = new Map<string, PokerRoom>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const teamId = client.handshake.query.team_id as string;
    const user = this.getUserFromJWT(client);

    if (!user) return;

    const userQuery = await this.prismaService.user.findUnique({
      where: { id: user.id },
      include: {
        TeamUsers: {
          where: { team_id: teamId },
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

    const membership = userQuery.TeamUsers.at(0);
    if (!membership) {
      this.doException(
        client,
        ErrorTypes.Unauthorized,
        `User (${user.id}) is not in team (${teamId})`,
      );
      return;
    }

    const room = this.rooms.get(teamId) ?? new PokerRoom(teamId);
    this.rooms.set(teamId, room);
    room.addUser(client.id, {
      userId: userQuery.id,
      avatarLink: userQuery.avatar_link,
      role: membership.role,
    });
    this.users.set(client.id, { roomId: room.id, userId: userQuery.id });

    await client.join(room.id);
    this.emitSync(room);
  }

  @SubscribeMessage("command_select_deck")
  handleSelectDeck(client: Socket, payload: SelectPokerDeckCommand) {
    const room = this.getClientRoom(client);
    if (!room || !room.selectDeck(payload.deckId)) return;

    this.emitSync(room);
  }

  @SubscribeMessage("command_select_card")
  handleSelectCard(client: Socket, payload: SelectPokerCardCommand) {
    const connection = this.users.get(client.id);
    const room = this.getClientRoom(client);
    if (!connection || !room) return;

    if (!room.selectCard(connection.userId, payload.card)) return;

    this.emitSync(room);
  }

  handleDisconnect(client: Socket) {
    const connection = this.users.get(client.id);
    if (!connection) return;

    const room = this.rooms.get(connection.roomId);
    this.users.delete(client.id);
    if (!room) return;

    room.removeUser(client.id);
    this.emitSync(room);

    if (room.connectedUsers.size === 0) {
      this.rooms.delete(room.id);
    }
  }

  private emitSync(room: PokerRoom) {
    this.server.to(room.id).emit("event_poker_sync", room.getRoomSyncData());
  }

  private doException(client: Socket, type: ErrorTypes, message: string) {
    this.users.delete(client.id);
    client.emit("error", { type, message });
    client.disconnect();
  }

  private getUserFromJWT(client: Socket): { id: string } | undefined {
    try {
      const result = this.jwtService.verify(
        client.handshake.headers.authorization,
        { secret: process.env.JWT_SECRET },
      );
      return result.user;
    } catch {
      this.doException(client, ErrorTypes.JwtError, "JWT must be provided!");
      return undefined;
    }
  }

  private getClientRoom(client: Socket) {
    const connection = this.users.get(client.id);
    if (!connection) return undefined;

    return this.rooms.get(connection.roomId);
  }
}
