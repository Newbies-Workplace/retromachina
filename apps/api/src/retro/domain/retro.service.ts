import { Injectable, type OnModuleInit } from "@nestjs/common";
import { RetroCreateRequest } from "shared/model/retro/retro.request";
import { PrismaService } from "src/prisma/prisma.service";
import { v4 as uuid } from "uuid";
import { RetroGateway } from "../application/retro.gateway";

@Injectable()
export class RetroService implements OnModuleInit {
  constructor(
    private prismaService: PrismaService,
    private retroGateway: RetroGateway,
  ) {}

  async onModuleInit() {
    await this.prismaService.retrospective.updateMany({
      data: {
        is_running: false,
      },
    });
  }

  async createRetro(userId: string, request: RetroCreateRequest) {
    const retroId = uuid();
    const retro = await this.prismaService.retrospective.create({
      data: {
        id: retroId,
        date: new Date(),
        is_running: true,
        team_id: request.teamId,
      },
    });

    await this.retroGateway.addRetroRoom(
      retroId,
      request.teamId,
      request.columns.map((column) => {
        return {
          id: uuid(),
          name: column.name,
          description: column.desc,
          cards: [],
          isWriting: false,
          teamCardsAmount: 0,
        };
      }),
    );

    return retro;
  }
}
