import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "generated/prisma/client";
import type {
  OrganizationMemberRequest,
  OrganizationRequest,
} from "shared/model/organization/organization.request";
import type {
  OrganizationDetailsResponse,
  OrganizationMembershipResponse,
} from "shared/model/organization/organization.response";
import { PrismaService } from "../prisma/prisma.service";
import { isReservedOrganizationSlug } from "../team/team-slug";

@Injectable()
export class OrganizationService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    userId: string,
    request: OrganizationRequest,
  ): Promise<OrganizationMembershipResponse> {
    const name = request.name.trim();
    if (!name || isReservedOrganizationSlug(request.slug)) {
      throw new BadRequestException(
        "Invalid organization name or reserved subdomain",
      );
    }
    try {
      const organization = await this.prismaService.organization.create({
        data: {
          name,
          slug: request.slug,
          Users: { create: { user_id: userId, role: Role.OWNER } },
        },
      });
      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: Role.OWNER,
      };
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        throw new ConflictException("Organization subdomain is already taken");
      }
      throw error;
    }
  }

  async details(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationDetailsResponse> {
    const membership = await this.requireMembership(userId, organizationId);
    const canManage = membership.role !== Role.USER;
    const teams = await this.prismaService.team.findMany({
      where: {
        organization_id: organizationId,
        ...(canManage ? {} : { TeamUser: { some: { user_id: userId } } }),
      },
      include: { TeamUser: { where: { user_id: userId } } },
      orderBy: { name: "asc" },
    });
    const members = canManage
      ? await this.prismaService.organizationUsers.findMany({
          where: { organization_id: organizationId },
          include: { User: true },
          orderBy: { User: { nick: "asc" } },
        })
      : [];
    return {
      id: membership.Organization.id,
      name: membership.Organization.name,
      slug: membership.Organization.slug,
      role: membership.role,
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        slug: team.slug,
        canAccess: team.TeamUser.length > 0,
      })),
      members: members.map(({ User: user, role }) => ({
        id: user.id,
        nick: user.nick,
        email: user.email,
        avatar_link: user.avatar_link,
        role,
      })),
    };
  }

  async putMember(
    userId: string,
    organizationId: string,
    request: OrganizationMemberRequest,
  ) {
    await this.requireMembership(userId, organizationId, [
      Role.OWNER,
      Role.ADMIN,
    ]);
    const user = await this.prismaService.user.findUnique({
      where: { email: request.email.trim().toLowerCase() },
    });
    if (!user)
      throw new NotFoundException(
        "User must sign in before joining an organization",
      );
    await this.prismaService.$transaction(async (tx) => {
      const where = {
        organization_id_user_id: {
          organization_id: organizationId,
          user_id: user.id,
        },
      };
      const existing = await tx.organizationUsers.findUnique({ where });
      if (existing?.role === Role.OWNER)
        throw new ForbiddenException("Cannot change the organization owner");
      if (user.id === userId)
        throw new BadRequestException("Cannot change your own role");
      await tx.organizationUsers.upsert({
        where,
        create: {
          organization_id: organizationId,
          user_id: user.id,
          role: request.role,
        },
        update: { role: request.role },
      });
    });
  }

  async removeMember(userId: string, organizationId: string, memberId: string) {
    await this.requireMembership(userId, organizationId, [
      Role.OWNER,
      Role.ADMIN,
    ]);
    if (memberId === userId)
      throw new BadRequestException("Cannot remove yourself");
    const removed = await this.prismaService.organizationUsers.deleteMany({
      where: {
        organization_id: organizationId,
        user_id: memberId,
        role: { not: Role.OWNER },
      },
    });
    if (!removed.count)
      throw new BadRequestException(
        "Member not found or is the organization owner",
      );
  }

  async listForUser(userId: string): Promise<OrganizationMembershipResponse[]> {
    const memberships = await this.prismaService.organizationUsers.findMany({
      where: { user_id: userId },
      include: { Organization: true },
      orderBy: { Organization: { name: "asc" } },
    });
    return memberships.map(({ Organization: organization, role }) => ({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role,
    }));
  }

  async requireMembership(
    userId: string,
    organizationId: string,
    roles: readonly Role[] = [Role.OWNER, Role.ADMIN, Role.USER],
  ) {
    const membership = await this.prismaService.organizationUsers.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: organizationId,
          user_id: userId,
        },
      },
      include: { Organization: true },
    });
    if (!membership || !roles.includes(membership.role)) {
      throw new ForbiddenException("Organization access denied");
    }
    return membership;
  }
}
