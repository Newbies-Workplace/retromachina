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
import { Role } from "generated/prisma/client";
import { ReflectionCardRequest } from "shared/model/team/reflectionCard.request";
import { ReflectionCardResponse } from "shared/model/team/reflectionCard.response";
import { TeamGetQuery } from "shared/model/team/team.query";
import {
  EditTeamInviteRequest,
  EditTeamRequest,
  TeamRequest,
  TeamUserRequest,
} from "shared/model/team/team.request";
import { TeamResponse } from "shared/model/team/team.response";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import { PrismaService } from "../../prisma/prisma.service";
import { TeamService } from "../team.service";
import { toReflectionCardResponse } from "./reflectionCard.converter";
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

    return toTeamResponse(team);
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

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    return toTeamResponse(team);
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

    ForbiddenError.from(ability).throwUnlessCan(
      "update",
      subject("Team", team),
    );

    const updatedTeam = await this.teamService.editTeam(user, team, request);

    return toTeamResponse(updatedTeam);
  }

  @UseGuards(JwtGuard)
  @Put(":id/members")
  async setTeamMember(
    @User() user: JWTUser,
    @Param("id") teamId: string,
    @Body() request: TeamUserRequest,
  ): Promise<void> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan(
      "update",
      subject("Team", team),
    );

    await this.teamService.putTeamMember(user, teamId, request);
  }

  @UseGuards(JwtGuard)
  @Delete(":id/members/:email")
  async deleteTeamMember(
    @User() user: JWTUser,
    @Param("id") teamId: string,
    @Param("email") email: string,
  ): Promise<void> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan(
      "update",
      subject("Team", team),
    );

    await this.teamService.deleteTeamMember(user, teamId, email);
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

    ForbiddenError.from(ability).throwUnlessCan(
      "update",
      subject("Team", team),
    );

    const updatedTeam = await this.teamService.editTeamInviteKey(team, request);

    return toTeamResponse(updatedTeam);
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

    return toTeamResponse(team);
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

    await this.teamService.deleteTeam(team.id);
  }

  @UseGuards(JwtGuard)
  @Get(":id/reflection_cards")
  async getReflectionCards(
    @User() user: JWTUser,
    @Param("id") teamId: string,
  ): Promise<ReflectionCardResponse[]> {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    const reflectionCards = await this.prismaService.reflectionCard.findMany({
      where: {
        team_id: teamId,
        user_id: user.id,
      },
    });

    return reflectionCards.map(toReflectionCardResponse);
  }

  @UseGuards(JwtGuard)
  @Post(":id/reflection_cards")
  async addReflectionCard(
    @User() user: JWTUser,
    @Param("id") teamId: string,
    @Body() request: ReflectionCardRequest,
  ) {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    const card = await this.teamService.createReflectionCard(
      teamId,
      user.id,
      request,
    );

    return toReflectionCardResponse(card);
  }

  @UseGuards(JwtGuard)
  @Delete(":id/reflection_cards/:reflectionCardId")
  async removeReflectionCard(
    @User() user: JWTUser,
    @Param("id") teamId: string,
    @Param("reflectionCardId") reflectionCardId: string,
  ) {
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    await this.teamService.deleteReflectionCard(reflectionCardId);
  }
}
