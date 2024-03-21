import { ForbiddenError, subject } from "@casl/ability";
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { TaskResponse } from "shared/model/task/task.response";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import type { AppAbility, AuthAbilityFactory } from "../../auth/auth.ability";
import type { JWTUser } from "../../auth/jwt/JWTUser";
import { User } from "../../auth/jwt/jwtuser.decorator";
import type { PrismaService } from "../../prisma/prisma.service";
import { toTaskResponse } from "./task.converter";

@Controller("tasks")
export class TaskController {
  constructor(
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
  ) {}

  @UseGuards(JwtGuard)
  @Get()
  async getTasks(
    @User() user: JWTUser,
    @Query() query: { team_id?: string; retro_id?: string },
  ): Promise<TaskResponse[]> {
    const ability = this.abilityFactory.create(user);

    if (query.retro_id && query.retro_id.length !== 0) {
      return this.getRetroTasks(ability, query.retro_id);
    }
    if (query.team_id && query.team_id.length !== 0) {
      return this.getTeamTasks(ability, query.team_id);
    }

    throw new BadRequestException("Bad query param");
  }

  private async getRetroTasks(
    ability: AppAbility,
    retroId: string,
  ): Promise<TaskResponse[]> {
    const retro = await this.prismaService.retrospective.findUniqueOrThrow({
      where: {
        id: retroId,
      },
    });

    ForbiddenError.from(ability).throwUnlessCan(
      "read",
      subject("Retro", retro),
    );

    const tasks = await this.prismaService.task.findMany({
      where: {
        retro_id: retroId,
      },
    });

    return tasks.map(toTaskResponse);
  }

  private async getTeamTasks(
    ability: AppAbility,
    teamId: string,
  ): Promise<TaskResponse[]> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    const tasks = await this.prismaService.task.findMany({
      where: {
        team_id: teamId,
      },
    });

    return tasks.map(toTaskResponse);
  }
}
