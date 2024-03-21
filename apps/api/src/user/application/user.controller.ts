import { ForbiddenError, subject } from "@casl/ability";
import {
  Controller,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  UserInTeamResponse,
  UserWithTeamsResponse,
} from "shared/model/user/user.response";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import { PrismaService } from "../../prisma/prisma.service";
import { TeamConverter } from "../../team/application/team.converter";
import { toUserInTeamResponse, toUserResponse } from "./user.converter";

@Controller("users")
export class UserController {
  constructor(
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
    private teamConverter: TeamConverter,
  ) {}

  @Get("@me")
  @UseGuards(JwtGuard)
  async getUser(@User() user: JWTUser): Promise<UserWithTeamsResponse> {
    //todo rewrite NotFoundError and ForbiddenError

    const userWithTeams = await this.prismaService.user.findUnique({
      where: {
        google_id: user.google_id,
      },
      include: {
        TeamUsers: {
          include: {
            Team: true,
          },
        },
      },
    });

    const teams = userWithTeams.TeamUsers.map(async (teamUser) => {
      const team = await this.teamConverter.toTeamResponse(teamUser.Team);
      return {
        ...team,
        role: teamUser.role,
      };
    });

    return {
      ...toUserResponse(userWithTeams),
      teams: await Promise.all(teams),
    };
  }

  @Get("")
  @UseGuards(JwtGuard)
  async getUsers(
    @User() user: JWTUser,
    @Query("team_id") teamId: string,
  ): Promise<UserInTeamResponse[]> {
    if (!teamId || teamId.trim().length === 0) throw new NotFoundException();
    const team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
      include: {
        TeamUser: {
          include: {
            User: true,
          },
        },
      },
    });

    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan("read", subject("Team", team));

    return team.TeamUser.map((teamUser) =>
      toUserInTeamResponse(teamUser.User, teamUser.role),
    );
  }
}
