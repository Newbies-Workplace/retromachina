import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import type { Role } from "generated/prisma/client";
import type { Socket } from "socket.io";
import type { Adapter, BroadcastOptions } from "socket.io-adapter";
import {
  type AccessClaims,
  AccessTokenService,
} from "../auth/session/access-token.service";
import { PrismaService } from "../prisma/prisma.service";

type Connection = {
  teamId: string;
  userId: string;
  expiryTimer?: ReturnType<typeof setTimeout>;
  claims?: AccessClaims;
  refreshRole: (role: Role) => void;
};

@Injectable()
export class TeamSocketAccessService {
  private readonly broadcastQueues = new WeakMap<
    Adapter,
    { pending: Promise<void> }
  >();
  private readonly connections = new Map<Socket, Connection>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessTokenService,
  ) {}

  register(
    client: Socket,
    teamId: string,
    userId: string,
    refreshRole: (role: Role) => void,
  ): void {
    if (client.nsp?.adapter) this.protectBroadcasts(client.nsp.adapter);
    const claims = client.data?.authClaims as AccessClaims | undefined;
    const connection: Connection = { teamId, userId, refreshRole, claims };
    if (claims) {
      connection.expiryTimer = setTimeout(
        () => {
          this.unregister(client);
          client.disconnect();
        },
        Math.max(0, claims.exp * 1000 - Date.now()),
      );
      connection.expiryTimer.unref?.();
    }
    this.connections.set(client, connection);
  }

  // Room broadcasts bypass socket.emit; validate recipients at the adapter boundary.
  // Each instance checks the shared database before sending and preserves event order.
  private protectBroadcasts(adapter: Adapter): void {
    if (this.broadcastQueues.has(adapter)) return;
    const queue = { pending: Promise.resolve() };
    this.broadcastQueues.set(adapter, queue);
    const broadcast = adapter.broadcast.bind(adapter);
    adapter.broadcast = (packet, options) => {
      const snapshot = structuredClone(packet);
      const targets = {
        ...options,
        rooms: new Set(options.rooms),
        except: new Set(options.except ?? []),
      };
      const recipients = [...this.connections].filter(
        ([client]) =>
          client.nsp.adapter === adapter && this.isRecipient(client, targets),
      );
      queue.pending = queue.pending
        .then(async () => {
          await Promise.all(
            recipients.map(async ([client, connection]) => {
              try {
                if (!connection.claims)
                  throw new WsException("Session required");
                await this.access.assertSession(connection.claims);
              } catch {
                this.unregister(client);
                client.disconnect();
              }
            }),
          );
          const authorized = new Set<string>();
          for (const [client, connection] of recipients) {
            if (
              !client.connected ||
              this.connections.get(client) !== connection
            )
              continue;
            try {
              this.access.validateClaims(connection.claims);
              if (this.isRecipient(client, targets)) authorized.add(client.id);
            } catch {
              this.unregister(client);
              client.disconnect();
            }
          }
          if (authorized.size)
            broadcast(snapshot, { ...targets, rooms: authorized });
        })
        .catch(() => {
          /* Fail closed; a later event can still be processed. */
        });
    };
  }

  async flushBroadcasts(adapter: Adapter | undefined): Promise<void> {
    if (adapter) await this.broadcastQueues.get(adapter)?.pending;
  }

  private isRecipient(client: Socket, options: BroadcastOptions): boolean {
    const rooms = client.rooms;
    return (
      (options.rooms.size === 0 ||
        [...options.rooms].some((room) => rooms.has(room))) &&
      ![...(options.except ?? [])].some((room) => rooms.has(room))
    );
  }

  unregister(client: Socket): void {
    clearTimeout(this.connections.get(client)?.expiryTimer);
    this.connections.delete(client);
  }

  async authorize(client: Socket): Promise<void> {
    const connection = this.connections.get(client);
    if (!connection) throw new WsException("Team access denied");

    try {
      if (!client.connected) throw new WsException("Team access denied");
      if (!connection.claims || connection.claims.user.id !== connection.userId)
        throw new WsException("Team access denied");
      await this.access.assertSession(connection.claims);
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
      this.access.validateClaims(connection.claims);
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
