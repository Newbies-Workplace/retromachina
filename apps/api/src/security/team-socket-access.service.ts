import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import type { Role } from "generated/prisma/client";
import type { Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";

type Connection = {
  teamId: string;
  userId: string;
  refreshRole: (role: Role) => void;
};

@Injectable()
export class TeamSocketAccessService {
  private readonly connections = new Map<Socket, Connection>();

  constructor(private readonly prisma: PrismaService) {}

  register(
    client: Socket,
    teamId: string,
    userId: string,
    refreshRole: (role: Role) => void,
  ): void {
    this.connections.set(client, { teamId, userId, refreshRole });
  }

  unregister(client: Socket): void {
    this.connections.delete(client);
  }

  async authorize(client: Socket): Promise<void> {
    const connection = this.connections.get(client);
    if (!connection) throw new WsException("Team access denied");

    try {
      if (!client.connected) throw new WsException("Team access denied");
      const membership = await this.prisma.teamUsers.findUnique({
        where: {
          team_id_user_id: {
            team_id: connection.teamId,
            user_id: connection.userId,
          },
        },
        select: { role: true },
      });
      // Revocation can happen while the database query is in flight.
      if (
        !membership ||
        !client.connected ||
        this.connections.get(client) !== connection
      ) {
        throw new WsException("Team access denied");
      }
      connection.refreshRole(membership.role);
    } catch {
      this.unregister(client);
      client.disconnect();
      throw new WsException("Team access denied");
    }
  }

  revokeUser(teamId: string, userId: string): void {
    for (const [client, connection] of this.connections) {
      if (connection.teamId === teamId && connection.userId === userId) {
        this.unregister(client);
        client.disconnect();
      }
    }
  }

  revokeTeam(teamId: string): void {
    for (const [client, connection] of this.connections) {
      if (connection.teamId === teamId) {
        this.unregister(client);
        client.disconnect();
      }
    }
  }
}
