import { Injectable, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type {
  ClearPokerTableCommand,
  RevealPokerCardsCommand,
  SelectPokerCardCommand,
  SelectPokerDeckCommand,
} from "shared/model/poker/poker.commands";
import { ErrorTypes } from "shared/model/retro/ErrorTypes";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../../auth/session/access-token.service";
import { PrismaService } from "../../prisma/prisma.service";
import { TeamSocketGuard } from "../../security/team-socket.guard";
import { TeamSocketAccessService } from "../../security/team-socket-access.service";
import { PokerRoom } from "../domain/model/pokerRoom.object";

type ConnectedUser = {
  roomId: string;
  userId: string;
};

@Injectable()
@UseGuards(TeamSocketGuard)
@WebSocketGateway(3001, { cors: true, namespace: "poker" })
export class PokerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly users = new Map<string, ConnectedUser>();
  private readonly rooms = new Map<string, PokerRoom>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly access: TeamSocketAccessService,
  ) {}

  async handleConnection(client: Socket) {
    const teamId = client.handshake.query.team_id;
    if (typeof teamId !== "string" || teamId.trim().length === 0) {
      this.doException(
        client,
        ErrorTypes.Unauthorized,
        "Team must be provided",
      );
      return;
    }
    const user = this.getUserFromJWT(client);

    if (typeof user?.id !== "string" || user.id.trim().length === 0) {
      this.doException(client, ErrorTypes.JwtError, "Invalid token user");
      return;
    }

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
      nick: userQuery.nick,
      avatarLink: userQuery.avatar_link,
      role: membership.role,
    });
    this.users.set(client.id, { roomId: room.id, userId: userQuery.id });

    this.access.register(client, teamId, userQuery.id, (role) => {
      const connected = room.connectedUsers.get(client.id);
      if (connected) connected.role = role;
    });
    try {
      await this.access.authorize(client);
    } catch {
      this.handleDisconnect(client);
      this.doException(client, ErrorTypes.Unauthorized, "Team access denied");
      return;
    }
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

  @SubscribeMessage("command_reveal_cards")
  handleRevealCards(client: Socket, _payload: RevealPokerCardsCommand) {
    const room = this.getClientRoom(client);
    if (!room) return;

    room.revealCards();
    this.emitSync(room);
  }

  @SubscribeMessage("command_clear_table")
  handleClearTable(client: Socket, _payload: ClearPokerTableCommand) {
    const room = this.getClientRoom(client);
    if (!room) return;

    room.clearTable();
    this.server.to(room.id).emit("event_poker_table_cleared");
    this.emitSync(room);
  }

  handleDisconnect(client: Socket) {
    this.access.unregister(client);
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
    this.access.unregister(client);
    this.users.delete(client.id);
    client.emit("error", { type, message });
    client.disconnect();
  }

  private getUserFromJWT(client: Socket): { id: string } | undefined {
    try {
      const claims = verifyAccessToken(
        this.jwtService,
        client.handshake.headers.authorization,
      );
      client.data ??= {};
      client.data.authClaims = claims;
      return claims.user;
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
