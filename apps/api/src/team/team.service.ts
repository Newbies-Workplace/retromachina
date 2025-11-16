import {ReflectionCard, Role, Team} from "generated/prisma/client";
import {BadRequestException, Injectable} from "@nestjs/common";
import {ReflectionCardRequest} from "shared/model/team/reflectionCard.request";
import {EditTeamInviteRequest, EditTeamRequest, TeamRequest, TeamUserRequest,} from "shared/model/team/team.request";
import {JWTUser} from "src/auth/jwt/JWTUser";
import {PrismaService} from "src/prisma/prisma.service";
import {v4 as uuid} from "uuid";
import {RetroGateway} from "../retro/application/retro.gateway";

@Injectable()
export class TeamService {
  constructor(
    private prismaService: PrismaService,
    private retroGateway: RetroGateway,
  ) {
  }

  async createTeam(user: JWTUser, createTeamDto: TeamRequest): Promise<Team> {
    const team = await this.prismaService.team.create({
      data: {
        name: createTeamDto.name,
        invite_key: createTeamDto.invite_key,
      },
    });

    await this.prismaService.teamUsers.create({
      data: {
        team_id: team.id,
        user_id: user.id,
        role: "OWNER",
      },
    });

    await this.createTeamBoard(team.id);

    return team;
  }

  async editTeam(
    user: JWTUser,
    team: Team,
    editTeamDto: EditTeamRequest,
  ): Promise<Team> {
    return this.prismaService.team.update({
      where: {
        id: team.id,
      },
      data: {
        name: editTeamDto.name,
        invite_key: editTeamDto.invite_key || null,
      },
    });
  }

  async putTeamMember(
    caller: JWTUser,
    teamId: string,
    requestUser: TeamUserRequest,
  ): Promise<void> {
    // todo do not overwrite own role
    const user = await this.prismaService.user.findFirst({
      where: {
        email: requestUser.email,
      },
    });
    if (user) {
      await this.addUserToTeam(user.id, teamId, requestUser.role);

      return
    }

    const invitation = await this.prismaService.invite.findFirst({
      where: {
        email: requestUser.email,
        team_id: teamId,
      },
    });
    if (invitation) {
      await this.prismaService.invite.update({
        where: {
          id: invitation.id,
        },
        data: {
          role: requestUser.role,
          from: caller.id,
        },
      });

      return
    }

    await this.prismaService.invite.create({
      data: {
        email: requestUser.email,
        team_id: teamId,
        from: caller.id,
        role: requestUser.role,
      },
    });
  }

  async deleteTeamMember(
    caller: JWTUser,
    teamId: string,
    email: string,
  ): Promise<void> {
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
        Invite: true,
      },
    });

    const users = team.TeamUser.map((tu) => tu.User);
    const invites = team.Invite;

    // todo check for permissions

    const memberToRemove = users.find((u) => u.email === email);
    if (memberToRemove) {
      if (memberToRemove.id === caller.id) {
        throw new BadRequestException(
          "User cannot remove himself from the team",
        );
      }

      await this.removeUserFromTeam(memberToRemove.id, team.id);
    }

    const inviteToRemove = invites.find((i) => i.email === email);
    if (inviteToRemove) {
      await this.prismaService.invite.delete({
        where: {
          id: inviteToRemove.id,
        },
      });
    }
  }

  async removeUserFromTeam(userId: string, teamId: string) {
    await this.prismaService.teamUsers.delete({
      where: {
        team_id_user_id: {
          team_id: teamId,
          user_id: userId,
        },
      },
    });
    await this.unassignUserFromTasks(userId, teamId);

    await this.retroGateway.handleTeamUserRemoved(teamId, userId);
  }

  async editTeamInviteKey(
    team: Team,
    request: EditTeamInviteRequest,
  ): Promise<Team> {
    await this.prismaService.team.update({
      where: {
        id: team.id,
      },
      data: {
        invite_key: request.invite_key || null,
      },
    });

    return team;
  }

  async addUserToTeam(userId: string, teamId: string, role: Role) {
    await this.prismaService.teamUsers.create({
      data: {
        team_id: teamId,
        user_id: userId,
        role: role,
      },
    });

    await this.retroGateway.handleTeamUserAdded(teamId, userId);
  }

  async deleteTeam(teamId: string) {
    await this.prismaService.team.delete({
      where: {
        id: teamId,
      },
    });

    await this.retroGateway.handleTeamDeleted(teamId);
  }

  async createReflectionCard(
    teamId: string,
    userId: string,
    request: ReflectionCardRequest,
  ): Promise<ReflectionCard> {
    return this.prismaService.reflectionCard.create({
      data: {
        team_id: teamId,
        user_id: userId,
        text: request.text,
      },
    });
  }

  async deleteReflectionCard(reflectionCardId: string) {
    await this.prismaService.reflectionCard.delete({
      where: {
        id: reflectionCardId,
      },
    });
  }

  private async createTeamBoard(teamId: string) {
    const backlogId = uuid();

    await this.prismaService.board.create({
      data: {
        team_id: teamId,
        default_column_id: backlogId,
        BoardColumns: {
          create: [
            {
              id: backlogId,
              name: "To do",
              order: 0,
            },
            {
              id: uuid(),
              name: "In progress",
              order: 1,
            },
            {
              id: uuid(),
              name: "Freezed",
              order: 1,
            },
            {
              id: uuid(),
              name: "Done",
              order: 3,
            },
          ],
        },
      },
    });
  }

  private async unassignUserFromTasks(userId: string, teamId: string) {
    await this.prismaService.task.updateMany({
      where: {
        team_id: teamId,
        owner_id: userId,
      },
      data: {
        owner_id: null,
      },
    });
  }
}
