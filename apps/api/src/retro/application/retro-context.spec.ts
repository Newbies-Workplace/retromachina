import type { JwtService } from "@nestjs/jwt";
import type { Socket } from "socket.io";
import { PrismaService } from "../../prisma/prisma.service";
import type { TeamSocketAccessService } from "../../security/team-socket-access.service";
import { RetroRoom } from "../domain/model/retroRoom.object";
import type { RetroRoomPersistence } from "../domain/retro-room.persistence";
import { RetroGateway } from "./retro.gateway";

jest.mock("../../prisma/prisma.service", () => ({ PrismaService: class {} }));

describe("RetroGateway stale connection context", () => {
  it.each([
    "missing connection",
    "missing room",
    "missing room user",
  ])("leaves state/persistence untouched for %s", async (state) => {
    const persist = jest.fn();
    const gateway = new RetroGateway(
      {} as PrismaService,
      {} as JwtService,
      { persist } as unknown as RetroRoomPersistence,
      {} as TeamSocketAccessService,
    );
    const client = { id: "socket" } as Socket;
    const room = new RetroRoom("room", "team", []);
    if (state !== "missing connection") {
      gateway["users"].set(client.id, {
        roomId: room.id,
        teamId: room.teamId,
        user: { id: "user" } as never,
      });
    }
    if (state !== "missing room") gateway["retroRooms"].set(room.id, room);
    const before = structuredClone(room.getSnapshot());
    await expect(
      gateway.handleReady(client, { readyState: true }),
    ).resolves.toBeUndefined();
    await expect(
      gateway.handleRoomState(client, { roomState: "group" }),
    ).resolves.toBeUndefined();
    await expect(
      gateway.handleChangeTimer(client, { timestamp: 1 }),
    ).resolves.toBeUndefined();
    await expect(
      gateway.handleMoveCardToColumn(client, {
        cardId: "missing",
        columnId: "missing",
      }),
    ).resolves.toBeUndefined();
    expect(room.getSnapshot()).toEqual(before);
    expect(persist).not.toHaveBeenCalled();
  });
});
