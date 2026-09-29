import {
  BadRequestException,
  Injectable,
  type OnModuleInit,
} from "@nestjs/common";
import { RetroCreateRequest } from "shared/model/retro/retro.request";
import type { WarmupState } from "shared/model/warmup/warmup";
import { PrismaService } from "src/prisma/prisma.service";
import { v4 as uuid } from "uuid";
import { getEffectiveWarmups } from "../../warmup/warmup-links";
import { RetroGateway } from "../application/retro.gateway";
import { RetroRoom } from "./model/retroRoom.object";

@Injectable()
export class RetroService implements OnModuleInit {
  constructor(
    private prismaService: PrismaService,
    private retroGateway: RetroGateway,
  ) {}

  async onModuleInit() {
    await this.retroGateway.restoreRooms();
  }

  async createRetro(userId: string, request: RetroCreateRequest) {
    const retroId = uuid();
    const columns = request.columns.map((column) => ({
      id: uuid(),
      name: column.name,
      description: column.desc,
      cards: [],
      isWriting: false,
      teamCardsAmount: 0,
    }));
    const warmup = await this.createWarmupState(request);
    const room = new RetroRoom(retroId, request.teamId, columns, warmup);
    const retro = await this.prismaService.retrospective.create({
      data: {
        id: retroId,
        date: room.createdDate,
        is_running: true,
        team_id: request.teamId,
        room_state: JSON.parse(JSON.stringify(room.getSnapshot())),
      },
    });

    await this.retroGateway.addRetroRoom(
      retroId,
      request.teamId,
      columns,
      warmup,
    );

    return retro;
  }

  private async createWarmupState(
    request: RetroCreateRequest,
  ): Promise<WarmupState | null> {
    const selection = request.warmup ?? { mode: "none" as const };
    if (selection.mode === "none") return null;
    const candidates = await getEffectiveWarmups(
      this.prismaService,
      request.teamId,
    );
    if (candidates.length === 0) {
      throw new BadRequestException("No warmups available");
    }
    const selectedWarmupId =
      selection.mode === "selected" ? selection.warmupId : null;
    if (
      selectedWarmupId &&
      !candidates.some((item) => item.id === selectedWarmupId)
    ) {
      throw new BadRequestException("Selected warmup is unavailable");
    }
    return {
      candidates: candidates.map(({ source: _, ...item }) => item),
      status: "pending",
      selectedWarmupId,
      result: null,
      spinEndsAt: null,
      sharedRoomUrl: null,
      sharedRoomUrlRevision: 0,
      sharedRoomUrlUpdatedBy: null,
    };
  }
}
