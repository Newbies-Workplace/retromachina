import { Injectable } from "@nestjs/common";
import { Role, Team } from "@prisma/client";
import {
  EditTeamInviteRequest,
  EditTeamRequest,
  TeamRequest,
  TeamUserRequest,
} from "shared/model/team/team.request";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { PrismaService } from "src/prisma/prisma.service";
import { v4 as uuid } from "uuid";
import { RetroGateway } from "../retro/application/retro.gateway";

@Injectable()
export class TeamService {
  constructor(
    private prismaService: PrismaService,
    private retroGateway: RetroGateway,
  ) {}

  async createTeam(user: JWTUser, createTeamDto: TeamRequest): Promise<Team> {
    const team = await this.prismaService.team.create({
      data: {
        name: createTeamDto.name,
        owner_id: user.id,
        invite_key: createTeamDto.invite_key,
      },
    });

    await this.prismaService.teamUsers.create({
      data: {
        team_id: team.id,
        user_id: user.id,
        role: "ADMIN",
      },
    });

    await this.createTeamBoard(team.id);

    await this.addUsersAndInvitesToTeamUsers(
      createTeamDto.users,
      team.id,
      user.id,
    );

    return team;
  }

  async editTeam(
    user: JWTUser,
    team: Team,
    editTeamDto: EditTeamRequest,
  ): Promise<Team> {
    const updatedTeam = await this.prismaService.team.update({
      where: {
        id: team.id,
      },
      data: {
        name: editTeamDto.name,
        invite_key: editTeamDto.invite_key || null,
      },
      include: {
        TeamUser: {
          select: {
            User: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        Invite: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // remove users that are not in the new list
    const teamUsers = updatedTeam.TeamUser.map((tu) => tu.User);
    const usersToRemove = teamUsers
      .filter((tu) => !editTeamDto.users.some((u) => u.email === tu.email))
      .filter((tu) => tu.id !== user.id);
    for (const user of usersToRemove) {
      await this.removeUserFromTeam(user.id, team.id);
    }

    // delete invites that are not in the new list
    const teamInvites = updatedTeam.Invite;
    const invitesToRemove = teamInvites.filter(
      (i) => !editTeamDto.users.some((u) => u.email === i.email),
    );
    await this.prismaService.invite.deleteMany({
      where: {
        id: { in: invitesToRemove.map((i) => i.id) },
      },
    });

    // Add users and invites to team
    const emailsToAdd = editTeamDto.users.filter(
      (u) => !teamUsers.some((tu) => tu.email === u.email),
    );
    await this.addUsersAndInvitesToTeamUsers(emailsToAdd, team.id, user.id);

    return team;
  }

  async editTeamInvite(
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

  async removeUserFromTeam(userId: string, teamId: string) {
    await this.prismaService.teamUsers.delete({
      where: {
        team_id_user_id: {
          team_id: teamId,
          user_id: userId,
        },
      },
    });

    await this.retroGateway.handleTeamUserRemoved(teamId, userId);
  }

  async deleteTeam(team: Team) {
    await this.prismaService.team.delete({
      where: {
        id: team.id,
      },
    });

    await this.retroGateway.handleTeamDeleted(team.id);
  }

  private async addUsersAndInvitesToTeamUsers(
    requestUsers: TeamUserRequest[],
    teamId: string,
    adminId: string,
  ) {
    for (const requestUser of requestUsers) {
      const user = await this.prismaService.user.findFirst({
        where: {
          email: requestUser.email,
        },
      });

      if (!user) {
        await this.prismaService.invite.create({
          data: {
            email: requestUser.email,
            team_id: teamId,
            from: adminId,
            role: requestUser.role,
          },
        });

        continue;
      }

      await this.addUserToTeam(user.id, teamId, requestUser.role);
    }
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
              color: "#1dd7b2",
              order: 0,
            },
            {
              id: uuid(),
              name: "In progress",
              color: "#f7d148",
              order: 1,
            },
            {
              id: uuid(),
              name: "Freezed",
              color: "#233298",
              order: 1,
            },
            {
              id: uuid(),
              name: "Done",
              color: "#4caf50",
              order: 3,
            },
          ],
        },
      },
    });
  }
}
