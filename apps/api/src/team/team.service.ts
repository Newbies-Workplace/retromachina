import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ReflectionCard, Role, Team } from "generated/prisma/client";
import { ReflectionCardRequest } from "shared/model/team/reflectionCard.request";
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
import { TeamSocketAccessService } from "../security/team-socket-access.service";

@Injectable()
export class TeamService {
  constructor(
    private prismaService: PrismaService,
    private retroGateway: RetroGateway,
    private teamSocketAccessService: TeamSocketAccessService,
  ) {}

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
    const callerMembership = await this.getAuthorizedManager(caller, teamId);
    this.validateRole(requestUser.role);

    const user = await this.prismaService.user.findFirst({
      where: {
        email: requestUser.email,
      },
      include: {
        TeamUsers: {
          where: {
            team_id: teamId,
          },
        },
      },
    });

    if (user) {
      if (user.TeamUsers.length > 0) {
        const targetMembership = user.TeamUsers[0];
        this.assertCanManageMember(
          callerMembership.role,
          caller.id,
          user.id,
          targetMembership.role,
          requestUser.role,
        );

        // Repeating an existing role is an idempotent no-op. This preserves
        // compatibility with clients that submit the selected role unchanged.
        if (targetMembership.role === requestUser.role) {
          return;
        }

        await this.prismaService.teamUsers.update({
          where: {
            team_id_user_id: {
              team_id: teamId,
              user_id: user.id,
            },
          },
          data: {
            role: requestUser.role,
          },
        });
        this.teamSocketAccessService.revokeUser(teamId, user.id);

        return;
      }

      // add existing user to team
      this.assertCanGrantRole(callerMembership.role, requestUser.role);
      await this.addUserToTeam(user.id, teamId, requestUser.role);

      return;
    }

    const invitation = await this.prismaService.invite.findFirst({
      where: {
        email: requestUser.email,
        team_id: teamId,
      },
    });

    this.assertCanGrantRole(callerMembership.role, requestUser.role);

    // update existing invitation
    if (invitation) {
      if (invitation.role === Role.OWNER) {
        throw new ForbiddenException("Cannot modify an owner invitation");
      }
      await this.prismaService.invite.update({
        where: {
          id: invitation.id,
        },
        data: {
          role: requestUser.role,
          from: caller.id,
        },
      });

      return;
    }

    // create new invitation
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
    const callerMembership = await this.getAuthorizedManager(caller, teamId);
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

    const memberToRemove = users.find((u) => u.email === email);
    if (memberToRemove) {
      const targetMembership = team.TeamUser.find(
        (membership) => membership.user_id === memberToRemove.id,
      );
      if (targetMembership?.role === Role.OWNER) {
        throw new ForbiddenException("Cannot remove an owner");
      }
      if (memberToRemove.id === caller.id) {
        throw new ForbiddenException("Cannot remove yourself from the team");
      }
      this.assertCanManageMember(
        callerMembership.role,
        caller.id,
        memberToRemove.id,
        targetMembership?.role,
      );

      await this.removeUserFromTeam(memberToRemove.id, team.id);
    }

    const inviteToRemove = invites.find((i) => i.email === email);
    if (inviteToRemove) {
      if (inviteToRemove.role === Role.OWNER) {
        throw new ForbiddenException("Cannot remove an owner invitation");
      }
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
    this.teamSocketAccessService.revokeUser(teamId, userId);
    await this.unassignUserFromTasks(userId, teamId);

    await this.retroGateway.handleTeamUserRemoved(teamId, userId);
  }

  async editTeamInviteKey(
    team: Team,
    request: EditTeamInviteRequest,
  ): Promise<Team> {
    return this.prismaService.team.update({
      where: {
        id: team.id,
      },
      data: {
        invite_key: request.invite_key || null,
      },
    });
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
    this.teamSocketAccessService.revokeTeam(teamId);

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

  async editReflectionCard(
    reflectionCardId: string,
    teamId: string,
    userId: string,
    request: ReflectionCardRequest,
  ): Promise<ReflectionCard> {
    const result = await this.prismaService.reflectionCard.updateMany({
      where: {
        id: reflectionCardId,
        team_id: teamId,
        user_id: userId,
      },
      data: {
        text: request.text,
      },
    });
    if (result.count === 0) {
      throw new NotFoundException("Reflection card not found");
    }

    return this.prismaService.reflectionCard.findFirstOrThrow({
      where: {
        id: reflectionCardId,
        team_id: teamId,
        user_id: userId,
      },
    });
  }

  async deleteReflectionCard(
    reflectionCardId: string,
    teamId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.prismaService.reflectionCard.deleteMany({
      where: {
        id: reflectionCardId,
        team_id: teamId,
        user_id: userId,
      },
    });
    if (result.count === 0) {
      throw new NotFoundException("Reflection card not found");
    }
  }

  private async getAuthorizedManager(caller: JWTUser, teamId: string) {
    const membership = await this.prismaService.teamUsers.findUnique({
      where: {
        team_id_user_id: {
          team_id: teamId,
          user_id: caller.id,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== Role.ADMIN && membership.role !== Role.OWNER)
    ) {
      throw new ForbiddenException("Insufficient team permissions");
    }

    return membership;
  }

  private validateRole(role: unknown): asserts role is Role {
    if (!Object.values(Role).includes(role as Role)) {
      throw new BadRequestException("Invalid team member role");
    }
  }

  private assertCanGrantRole(callerRole: Role, targetRole: Role) {
    if (targetRole === Role.OWNER) {
      throw new ForbiddenException("Cannot grant owner role");
    }
    if (
      callerRole === Role.ADMIN &&
      targetRole !== Role.USER &&
      targetRole !== Role.ADMIN
    ) {
      throw new ForbiddenException("Insufficient team permissions");
    }
  }

  private assertCanManageMember(
    callerRole: Role,
    callerId: string,
    targetId: string,
    currentTargetRole: Role | undefined,
    requestedRole?: Role,
  ) {
    if (currentTargetRole === Role.OWNER) {
      if (requestedRole === Role.OWNER) {
        return;
      }
      throw new ForbiddenException("Cannot modify an owner");
    }
    if (callerId === targetId && requestedRole !== currentTargetRole) {
      throw new ForbiddenException("Cannot modify your own role");
    }
    if (callerRole !== Role.OWNER && callerRole !== Role.ADMIN) {
      throw new ForbiddenException("Insufficient team permissions");
    }
    if (requestedRole !== undefined) {
      this.assertCanGrantRole(callerRole, requestedRole);
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
