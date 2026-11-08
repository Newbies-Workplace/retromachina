import type { JwtService } from "@nestjs/jwt";
import type { Socket } from "socket.io";
import { BoardGateway } from "../board/application/board.gateway";
import { PokerGateway } from "../poker/application/poker.gateway";
import { PrismaService } from "../prisma/prisma.service";
import { RetroGateway } from "../retro/application/retro.gateway";
import { TeamSocketAccessService } from "./team-socket-access.service";

jest.mock("../prisma/prisma.service", () => ({ PrismaService: class {} }));

describe("gateway invalid token termination", () => {
  it.each([
    "JsonWebTokenError",
    "TokenExpiredError",
    "invalid-user",
  ])("fails closed on %s without database calls or rejected promises", async (reason) => {
    const prisma = { user: { findUnique: jest.fn(), findFirst: jest.fn() } };
    const access = { unregister: jest.fn(), register: jest.fn() };
    const jwt = {
      verify: () => {
        if (reason === "invalid-user")
          return { user: { id: [], google_id: {} } };
        const error = new Error("synthetic-invalid-token");
        error.name = reason;
        throw error;
      },
    };
    const gateways = [
      new BoardGateway(
        prisma as unknown as PrismaService,
        jwt as unknown as JwtService,
        access as unknown as TeamSocketAccessService,
      ),
      new RetroGateway(
        prisma as unknown as PrismaService,
        jwt as unknown as JwtService,
        {} as never,
        access as unknown as TeamSocketAccessService,
      ),
      new PokerGateway(
        prisma as unknown as PrismaService,
        jwt as unknown as JwtService,
        access as unknown as TeamSocketAccessService,
      ),
    ];
    for (const gateway of gateways) {
      const client = {
        id: "socket",
        handshake: {
          query: { team_id: "team", retro_id: "retro" },
          headers: {},
        },
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;
      await expect(gateway.handleConnection(client)).resolves.toBeUndefined();
      expect(client.disconnect).toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith("error", expect.any(Object));
    }
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(access.register).not.toHaveBeenCalled();
  });
});
