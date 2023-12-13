import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { TeamRequest, EditTeamRequest } from "./model/team.request";
import { TeamService } from "../team.service";
import { TeamResponse } from "./model/team.response";
import { TeamConverter } from "./team.converter";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import { ForbiddenError, subject } from "@casl/ability";

@Controller("teams")
export class TeamController {
  constructor(
    private teamService: TeamService,
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
    private teamConverter: TeamConverter
  ) {}

  @UseGuards(JwtGuard)
  @Post()
  async createTeam(
    @User() user: JWTUser,
    @Body() request: TeamRequest
  ): Promise<TeamResponse> {
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan("create", "Team");

    const team = await this.teamService.createTeam(user, request);

    return this.teamConverter.toTeamResponse(team);
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  async getTeam(
    @User() user: JWTUser,
    @Param("id") teamId: string
  ): Promise<TeamResponse> {
    if (teamId.trim().length === 0) {
      throw new BadRequestException("No `id` query param");
    }
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    return this.teamConverter.toTeamResponse(team);
  }

  @UseGuards(JwtGuard)
  @Put(":id")
  @HttpCode(204)
  async editTeam(
    @User() user: JWTUser,
    @Body() request: EditTeamRequest,
    @Param("id") teamId: string
  ): Promise<TeamResponse> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan(
      "update",
      subject("Team", team)
    );

    const updatedTeam = await this.teamService.editTeam(user, team, request);

    return this.teamConverter.toTeamResponse(updatedTeam);
  }

  @UseGuards(JwtGuard)
  @Delete(":id")
  async deleteTeam(@User() user: JWTUser, @Param("id") teamId: string) {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan(
      "delete",
      subject("Team", team)
    );

    await this.teamService.deleteTeam(team);
  }
}
