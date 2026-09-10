import { ForbiddenError, subject } from "@casl/ability";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RetroCreateRequest } from "shared/model/retro/retro.request";
import { RetroResponse } from "shared/model/retro/retro.response";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import { NotificationService } from "../../notification/notification.service";
import { RetroService } from "../domain/retro.service";
import { toRetroResponse } from "./retro.converter";

@Controller("retros")
export class RetroController {
  private readonly logger = new Logger(RetroController.name);

  constructor(
    private retroService: RetroService,
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
    private notifications: NotificationService,
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  async getTeamRetros(
    @User() user: JWTUser,
    @Query("team_id") teamId: string,
  ): Promise<RetroResponse[]> {
    if (teamId.trim().length === 0)
      throw new BadRequestException("No `team_id` query param");
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    const retros = await this.prismaService.retrospective.findMany({
      where: {
        team_id: teamId,
      },
      orderBy: {
        date: "desc",
      },
    });

    return retros.map(toRetroResponse);
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  async getRetro(
    @User() user: JWTUser,
    @Param("id") retroId: string,
  ): Promise<RetroResponse> {
    const retro = await this.prismaService.retrospective.findUniqueOrThrow({
      where: {
        id: retroId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan(
      "read",
      subject("Retro", retro),
    );

    return toRetroResponse(retro);
  }

  @Post()
  @UseGuards(JwtGuard)
  async createRetro(
    @User() user: JWTUser,
    @Body() request: RetroCreateRequest,
  ): Promise<RetroResponse> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: request.teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan(
      "startRetro",
      subject("Team", team),
    );

    await this.assertNotRunningRetro(team.id);

    const retro = await this.retroService.createRetro(user.id, request);

    try {
      await this.notifications.notifyTeamRetroStarted(team.id, user.id, {
        retroId: retro.id,
        teamId: team.id,
        teamName: team.name,
        startedAt: retro.date.toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Could not notify team about retrospective ${retro.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return toRetroResponse(retro);
  }

  private async assertNotRunningRetro(teamId: string) {
    const runningRetro = await this.prismaService.retrospective.findFirst({
      where: {
        is_running: true,
        team_id: teamId,
      },
    });
    if (runningRetro) {
      throw new BadRequestException(
        "One retro for this team is already running.",
      );
    }
  }
}
