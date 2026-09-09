import { Injectable } from "@nestjs/common";
import type { Prisma } from "generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RetroRoom, type RetroRoomSnapshot } from "./model/retroRoom.object";

@Injectable()
export class RetroRoomPersistence {
  private pendingWrites = new Map<string, Promise<void>>();

  constructor(private prismaService: PrismaService) {}

  async recoverRunningRooms(): Promise<RetroRoom[]> {
    const retros = await this.prismaService.retrospective.findMany({
      where: { is_running: true },
    });
    const rooms: RetroRoom[] = [];

    for (const retro of retros) {
      try {
        if (!retro.room_state)
          throw new Error("Missing retrospective snapshot");
        rooms.push(
          RetroRoom.restore(
            retro.id,
            retro.team_id,
            retro.room_state as unknown as RetroRoomSnapshot,
          ),
        );
      } catch {
        await this.markFinished(retro.id);
      }
    }

    return rooms;
  }

  persist(room: RetroRoom): Promise<void> {
    const snapshot = JSON.parse(
      JSON.stringify(room.getSnapshot()),
    ) as RetroRoomSnapshot;
    const previous = this.pendingWrites.get(room.id) ?? Promise.resolve();
    const write = previous
      .catch(() => undefined)
      .then(async () => {
        await this.prismaService.retrospective.update({
          where: { id: room.id },
          data: { room_state: snapshot as unknown as Prisma.InputJsonValue },
        });
      });

    this.pendingWrites.set(room.id, write);
    void write
      .finally(() => {
        if (this.pendingWrites.get(room.id) === write) {
          this.pendingWrites.delete(room.id);
        }
      })
      .catch(() => undefined);

    return write;
  }

  async markFinished(roomId: string): Promise<void> {
    await this.pendingWrites.get(roomId)?.catch(() => undefined);
    await this.prismaService.retrospective.update({
      where: { id: roomId },
      data: { is_running: false },
    });
  }
}
