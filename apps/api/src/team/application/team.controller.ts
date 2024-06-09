import { ForbiddenError, subject } from "@casl/ability";
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
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { TeamGetQuery } from "shared/model/team/team.query";
import {
  EditTeamInviteRequest,
  EditTeamRequest,
  TeamRequest,
} from "shared/model/team/team.request";
import { TeamResponse } from "shared/model/team/team.response";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import { PrismaService } from "../../prisma/prisma.service";
import { TeamService } from "../team.service";
import { toTeamResponse } from "./team.converter";

@Controller("teams")
export class TeamController {
  constructor(
    private teamService: TeamService,
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
  ) {}

  @UseGuards(JwtGuard)
  @Post()
  async createTeam(
    @User() user: JWTUser,
    @Body() request: TeamRequest,
  ): Promise<TeamResponse> {
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan("create", "Team");

    const team = await this.teamService.createTeam(user, request);

    return toTeamResponse(team, "ADMIN");
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  async getTeam(
    @User() user: JWTUser,
    @Param("id") teamId: string,
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
    const userRole = user.teams.find((team) => team.id === teamId)?.role;

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    return toTeamResponse(team, userRole);
  }

  @UseGuards(JwtGuard)
  @Put(":id")
  @HttpCode(204)
  async editTeam(
    @User() user: JWTUser,
    @Body() request: EditTeamRequest,
    @Param("id") teamId: string,
  ): Promise<TeamResponse> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);
    const userRole = user.teams.find((team) => team.id === teamId)?.role;

    ForbiddenError.from(ability).throwUnlessCan(
      "update",
      subject("Team", team),
    );

    const updatedTeam = await this.teamService.editTeam(user, team, request);

    return toTeamResponse(updatedTeam, userRole);
  }

  @UseGuards(JwtGuard)
  @Put(":id/link_invite")
  @HttpCode(204)
  async editTeamInvite(
    @User() user: JWTUser,
    @Body() request: EditTeamInviteRequest,
    @Param("id") teamId: string,
  ): Promise<TeamResponse> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);
    const userRole = user.teams.find((team) => team.id === teamId)?.role;

    ForbiddenError.from(ability).throwUnlessCan(
      "update",
      subject("Team", team),
    );

    const updatedTeam = await this.teamService.editTeamInvite(team, request);

    return toTeamResponse(updatedTeam, userRole);
  }

  @UseGuards(JwtGuard)
  @Post("link_invite/:inviteKey/accept")
  @HttpCode(204)
  async acceptInvite(
    @User() user: JWTUser,
    @Param("inviteKey") inviteKey: string,
  ) {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        invite_key: inviteKey,
      },
    });

    const isUserInTeam = user.teams.some((t) => t.id === team.id);
    if (isUserInTeam) {
      throw new BadRequestException("User is already in team");
    }

    await this.teamService.addUserToTeam(user.id, team.id, Role.USER);
  }

  @UseGuards(JwtGuard)
  @Get()
  async getTeamByInviteKey(
    @User() user: JWTUser,
    @Query() queryParams: TeamGetQuery,
  ): Promise<TeamResponse> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        invite_key: queryParams.invite_key,
      },
    });

    const isUserInTeam = user.teams.some((t) => t.id === team.id);
    if (isUserInTeam) {
      throw new BadRequestException("User is already in team");
    }

    return toTeamResponse(team, "USER");
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
      subject("Team", team),
    );

    await this.teamService.deleteTeam(team);
  }
}
