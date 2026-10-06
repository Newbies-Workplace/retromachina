import { WsException } from "@nestjs/websockets";
import type { Socket } from "socket.io";
import {
  AccessTokenService,
  validateAccessClaims,
} from "../auth/session/access-token.service";
import { TeamSocketAccessService } from "./team-socket-access.service";

jest.mock("../prisma/prisma.service", () => ({ PrismaService: class {} }));

const createClient = () =>
  ({
    connected: true,
    data: {
      authClaims: {
        exp: Math.floor(Date.now() / 1000) + 900,
        sid: "session",
        user: { id: "user-a", google_id: "google-a" },
      },
    },
    disconnect: jest.fn(),
  }) as unknown as Socket;

describe("TeamSocketAccessService", () => {
  afterEach(() => jest.useRealTimers());
  const prisma = { teamUsers: { findUnique: jest.fn() } };
  let access: TeamSocketAccessService;

  beforeEach(() => {
    jest.resetAllMocks();
    access = new TeamSocketAccessService(
      prisma as never,
      {
        assertSession: jest.fn().mockResolvedValue(undefined),
        validateClaims: validateAccessClaims,
      } as unknown as AccessTokenService,
    );
  });

  it("disconnects idle sockets at token expiry and rejects subsequent commands", async () => {
    jest.useFakeTimers({ doNotFake: ["performance"] });
    const client = createClient();
    client.data.authClaims.exp = Math.floor(Date.now() / 1000) + 2;
    access.register(client, "team-a", "user-a", jest.fn());
    jest.advanceTimersByTime(2000);
    expect(client.disconnect).toHaveBeenCalledTimes(1);
    await expect(access.authorize(client)).rejects.toThrow(WsException);
    expect(prisma.teamUsers.findUnique).not.toHaveBeenCalled();
  });

  it("refreshes the role from current membership, not connection-time permissions", async () => {
    const client = createClient();
    const refreshRole = jest.fn();
    access.register(client, "team-a", "user-a", refreshRole);
    prisma.teamUsers.findUnique.mockResolvedValue({ role: "USER" });
    await access.authorize(client);
    expect(refreshRole).toHaveBeenCalledWith("USER");
    expect(prisma.teamUsers.findUnique).toHaveBeenCalledWith({
      where: { team_id_user_id: { team_id: "team-a", user_id: "user-a" } },
      select: { role: true },
    });
  });

  it("rejects an unregistered client without querying the database", async () => {
    await expect(access.authorize(createClient())).rejects.toThrow(WsException);
    expect(prisma.teamUsers.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    null,
    "database-error",
  ])("fails closed when membership is %s", async (result) => {
    const client = createClient();
    const refreshRole = jest.fn();
    access.register(client, "team-a", "user-a", refreshRole);
    if (result === null) prisma.teamUsers.findUnique.mockResolvedValue(null);
    else prisma.teamUsers.findUnique.mockRejectedValue(new Error("DB failed"));
    await expect(access.authorize(client)).rejects.toThrow(
      "Team access denied",
    );
    expect(client.disconnect).toHaveBeenCalled();
    expect(refreshRole).not.toHaveBeenCalled();
    await expect(access.authorize(client)).rejects.toThrow(WsException);
    expect(prisma.teamUsers.findUnique).toHaveBeenCalledTimes(1);
  });

  it("rejects a connection that closed before initial authorization completed", async () => {
    const client = createClient();
    const refreshRole = jest.fn();
    client.connected = false;
    access.register(client, "team-a", "user-a", refreshRole);
    await expect(access.authorize(client)).rejects.toThrow(WsException);
    expect(prisma.teamUsers.findUnique).not.toHaveBeenCalled();
    expect(refreshRole).not.toHaveBeenCalled();
    client.connected = true;
    await expect(access.authorize(client)).rejects.toThrow(WsException);
  });

  it("revokes every namespace and session for the user, leaving other teams/users connected", async () => {
    const clients = Array.from({ length: 5 }, createClient);
    for (const client of clients.slice(0, 3))
      access.register(client, "team-a", "user-a", jest.fn());
    access.register(clients[3], "team-b", "user-a", jest.fn());
    access.register(clients[4], "team-a", "user-b", jest.fn());
    access.revokeUser("team-a", "user-a");
    for (const client of clients.slice(0, 3)) {
      expect(client.disconnect).toHaveBeenCalledTimes(1);
      await expect(access.authorize(client)).rejects.toThrow(WsException);
    }
    expect(clients[3].disconnect).not.toHaveBeenCalled();
    expect(clients[4].disconnect).not.toHaveBeenCalled();
  });

  it("rejects a command if revocation happens during membership lookup", async () => {
    const client = createClient();
    const refreshRole = jest.fn();
    access.register(client, "team-a", "user-a", refreshRole);
    let resolveLookup: (result: { role: string }) => void = () => {};
    let markStarted: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    prisma.teamUsers.findUnique.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLookup = resolve;
          markStarted();
        }),
    );
    const authorization = access.authorize(client);
    await started;
    access.revokeUser("team-a", "user-a");
    resolveLookup({ role: "ADMIN" });
    await expect(authorization).rejects.toThrow(WsException);
    expect(refreshRole).not.toHaveBeenCalled();
  });

  it("revokes a deleted team without disconnecting sessions in another team", () => {
    const deleted = createClient();
    const other = createClient();
    access.register(deleted, "team-a", "user-a", jest.fn());
    access.register(other, "team-b", "user-a", jest.fn());
    access.revokeTeam("team-a");
    expect(deleted.disconnect).toHaveBeenCalledTimes(1);
    expect(other.disconnect).not.toHaveBeenCalled();
  });
});
