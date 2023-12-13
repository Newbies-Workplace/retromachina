import {
  Controller,
  Get,
  Query,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import { ForbiddenError, subject } from "@casl/ability";
import { UserResponse, UserWithTeamsResponse } from "./model/user.response";
import { toUserResponse } from "./user.converter";
import { TeamConverter } from "../../team/application/team.converter";

@Controller("users")
export class UserController {
  constructor(
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
    private teamConverter: TeamConverter
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
    @Query("team_id") teamId: string
  ): Promise<UserResponse[]> {
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

    return team.TeamUser.map((teamUser) => toUserResponse(teamUser.User));
  }
}
