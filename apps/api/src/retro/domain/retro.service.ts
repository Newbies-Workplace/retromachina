import { Injectable, type OnModuleInit } from "@nestjs/common";
import { RetroCreateRequest } from "shared/model/retro/retro.request";
import { PrismaService } from "src/prisma/prisma.service";
import { v4 as uuid } from "uuid";
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
    const room = new RetroRoom(retroId, request.teamId, columns);
    const retro = await this.prismaService.retrospective.create({
      data: {
        id: retroId,
        date: room.createdDate,
        is_running: true,
        team_id: request.teamId,
        room_state: JSON.parse(JSON.stringify(room.getSnapshot())),
      },
    });

    await this.retroGateway.addRetroRoom(retroId, request.teamId, columns);

    return retro;
  }
}
