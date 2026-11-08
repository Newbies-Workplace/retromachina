import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "generated/prisma/client";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { PrismaService } from "src/prisma/prisma.service";
import { RetroGateway } from "../retro/application/retro.gateway";
import { TeamSocketAccessService } from "../security/team-socket-access.service";
import { TeamService } from "./team.service";

jest.mock(
  "generated/prisma/client",
  () => ({ Role: { USER: "USER", ADMIN: "ADMIN", OWNER: "OWNER" } }),
  { virtual: true },
);
jest.mock("src/prisma/prisma.service", () => ({ PrismaService: class {} }), {
  virtual: true,
});
jest.mock("../retro/application/retro.gateway", () => ({
  RetroGateway: class {},
}));
jest.mock("../security/team-socket-access.service", () => ({
  TeamSocketAccessService: class {},
}));

const TEAM_ID = "team-1";
const ADMIN = { id: "admin-1" } as JWTUser;
const OWNER = { id: "owner-1" } as JWTUser;
const OUTSIDER = { id: "outsider-1" } as JWTUser;

function setup() {
  const prisma = {
    teamUsers: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    user: { findFirst: jest.fn() },
    invite: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    team: { findUniqueOrThrow: jest.fn(), delete: jest.fn() },
    task: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    reflectionCard: {
      updateMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const retroGateway = {
    handleTeamUserAdded: jest.fn(),
    handleTeamUserRemoved: jest.fn(),
    handleTeamDeleted: jest.fn(),
  };
  const socketAccess = { revokeUser: jest.fn(), revokeTeam: jest.fn() };
  const service = new TeamService(
    prisma as unknown as PrismaService,
    retroGateway as unknown as RetroGateway,
    socketAccess as unknown as TeamSocketAccessService,
  );
  return { service, prisma, retroGateway, socketAccess };
}

function manager(role: Role) {
  const context = setup();
  context.prisma.teamUsers.findUnique.mockResolvedValue({
    team_id: TEAM_ID,
    user_id: role === Role.OWNER ? OWNER.id : ADMIN.id,
    role,
  });
  return context;
}

describe("TeamService authorization and reflection cards", () => {
  it("scopes reflection-card updates by card, URL team, and authenticated user", async () => {
    const { service, prisma } = setup();
    const card = {
      id: "card-1",
      team_id: TEAM_ID,
      user_id: "member-1",
      text: "updated",
    };
    prisma.reflectionCard.updateMany.mockResolvedValue({ count: 1 });
    prisma.reflectionCard.findFirstOrThrow.mockResolvedValue(card);

    await expect(
      service.editReflectionCard("card-1", TEAM_ID, "member-1", {
        text: "updated",
      }),
    ).resolves.toBe(card);
    expect(prisma.reflectionCard.updateMany).toHaveBeenCalledWith({
      where: { id: "card-1", team_id: TEAM_ID, user_id: "member-1" },
      data: { text: "updated" },
    });
  });

  it.each([
    [TEAM_ID, "other-user"],
    ["other-team", "member-1"],
  ])("rejects a reflection-card update with the wrong team or owner (%s, %s)", async (teamId, userId) => {
    const { service, prisma } = setup();
    prisma.reflectionCard.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.editReflectionCard("card-1", teamId, userId, {
        text: "stolen",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reflectionCard.updateMany).toHaveBeenCalledWith({
      where: { id: "card-1", team_id: teamId, user_id: userId },
      data: { text: "stolen" },
    });
    expect(prisma.reflectionCard.findFirstOrThrow).not.toHaveBeenCalled();
  });

  it("rejects cross-user or cross-team reflection-card deletes without deleting a card", async () => {
    const { service, prisma } = setup();
    prisma.reflectionCard.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.deleteReflectionCard("card-1", "other-team", "other-user"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reflectionCard.deleteMany).toHaveBeenCalledWith({
      where: { id: "card-1", team_id: "other-team", user_id: "other-user" },
    });
  });

  it("allows the card owner to update and delete their own card", async () => {
    const { service, prisma } = setup();
    prisma.reflectionCard.updateMany.mockResolvedValue({ count: 1 });
    prisma.reflectionCard.findFirstOrThrow.mockResolvedValue({ id: "card-1" });
    prisma.reflectionCard.deleteMany.mockResolvedValue({ count: 1 });

    await service.editReflectionCard("card-1", TEAM_ID, "member-1", {
      text: "mine",
    });
    await service.deleteReflectionCard("card-1", TEAM_ID, "member-1");

    expect(prisma.reflectionCard.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.reflectionCard.deleteMany).toHaveBeenCalledTimes(1);
  });

  it("rejects an outsider based on current database membership, regardless of JWT teams", async () => {
    const { service, prisma } = setup();
    prisma.teamUsers.findUnique.mockResolvedValue(null);

    await expect(
      service.putTeamMember(OUTSIDER, TEAM_ID, {
        email: "member@example.com",
        role: Role.ADMIN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("lets an ADMIN promote a USER to ADMIN and revokes their socket access", async () => {
    const { service, prisma, socketAccess } = manager(Role.ADMIN);
    prisma.user.findFirst.mockResolvedValue({
      id: "member-1",
      TeamUsers: [{ role: Role.USER }],
    });

    await service.putTeamMember(ADMIN, TEAM_ID, {
      email: "member@example.com",
      role: Role.ADMIN,
    });

    expect(prisma.teamUsers.update).toHaveBeenCalledWith({
      where: { team_id_user_id: { team_id: TEAM_ID, user_id: "member-1" } },
      data: { role: Role.ADMIN },
    });
    expect(socketAccess.revokeUser).toHaveBeenCalledWith(TEAM_ID, "member-1");
  });

  it("rejects ADMIN self-role changes and invalid role values", async () => {
    const { service, prisma } = manager(Role.ADMIN);
    prisma.user.findFirst.mockResolvedValue({
      id: ADMIN.id,
      TeamUsers: [{ role: Role.ADMIN }],
    });

    await expect(
      service.putTeamMember(ADMIN, TEAM_ID, {
        email: "admin@example.com",
        role: Role.OWNER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.teamUsers.update).not.toHaveBeenCalled();

    await expect(
      service.putTeamMember(ADMIN, TEAM_ID, {
        email: "admin@example.com",
        role: "INVALID" as Role,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("prevents ADMIN or OWNER from changing or removing an OWNER", async () => {
    for (const callerRole of [Role.ADMIN, Role.OWNER]) {
      const { service, prisma } = manager(callerRole);
      prisma.user.findFirst.mockResolvedValue({
        id: OWNER.id,
        TeamUsers: [{ role: Role.OWNER }],
      });

      await expect(
        service.putTeamMember(
          callerRole === Role.OWNER ? OWNER : ADMIN,
          TEAM_ID,
          { email: "owner@example.com", role: Role.ADMIN },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.teamUsers.update).not.toHaveBeenCalled();
    }

    const { service, prisma } = manager(Role.ADMIN);
    prisma.team.findUniqueOrThrow.mockResolvedValue({
      id: TEAM_ID,
      TeamUser: [
        {
          user_id: OWNER.id,
          role: Role.OWNER,
          User: { id: OWNER.id, email: "owner@example.com" },
        },
      ],
      Invite: [],
    });
    await expect(
      service.deleteTeamMember(ADMIN, TEAM_ID, "owner@example.com"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.teamUsers.delete).not.toHaveBeenCalled();
  });

  it("lets an OWNER manage USER and ADMIN members, but cannot grant OWNER through invite", async () => {
    const { service, prisma, socketAccess } = manager(Role.OWNER);
    prisma.user.findFirst
      .mockResolvedValueOnce({ id: "user-1", TeamUsers: [{ role: Role.USER }] })
      .mockResolvedValueOnce({ id: "member-2", TeamUsers: [] })
      .mockResolvedValueOnce(null);
    prisma.invite.findFirst.mockResolvedValue(null);

    await service.putTeamMember(OWNER, TEAM_ID, {
      email: "user@example.com",
      role: Role.ADMIN,
    });
    await service.putTeamMember(OWNER, TEAM_ID, {
      email: "new@example.com",
      role: Role.USER,
    });

    expect(prisma.teamUsers.update).toHaveBeenCalled();
    expect(socketAccess.revokeUser).toHaveBeenCalledWith(TEAM_ID, "user-1");
    expect(prisma.teamUsers.create).toHaveBeenCalledWith({
      data: { team_id: TEAM_ID, user_id: "member-2", role: Role.USER },
    });

    await expect(
      service.putTeamMember(OWNER, TEAM_ID, {
        email: "owner-invite@example.com",
        role: Role.OWNER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.invite.create).not.toHaveBeenCalled();
  });

  it("lets an ADMIN create USER invites and rejects OWNER invites", async () => {
    const { service, prisma } = manager(Role.ADMIN);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.invite.findFirst.mockResolvedValue(null);

    await service.putTeamMember(ADMIN, TEAM_ID, {
      email: "invite@example.com",
      role: Role.USER,
    });
    expect(prisma.invite.create).toHaveBeenCalledWith({
      data: {
        email: "invite@example.com",
        team_id: TEAM_ID,
        from: ADMIN.id,
        role: Role.USER,
      },
    });

    await expect(
      service.putTeamMember(ADMIN, TEAM_ID, {
        email: "owner-invite@example.com",
        role: Role.OWNER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("prevents ADMIN and OWNER from modifying or deleting existing OWNER invitations", async () => {
    for (const callerRole of [Role.ADMIN, Role.OWNER]) {
      const caller = callerRole === Role.ADMIN ? ADMIN : OWNER;
      const { service, prisma } = manager(callerRole);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.invite.findFirst.mockResolvedValue({
        id: "owner-invite-1",
        email: "owner@example.com",
        role: Role.OWNER,
      });

      await expect(
        service.putTeamMember(caller, TEAM_ID, {
          email: "owner@example.com",
          role: Role.USER,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.invite.update).not.toHaveBeenCalled();
    }

    const { service, prisma } = manager(Role.ADMIN);
    prisma.team.findUniqueOrThrow.mockResolvedValue({
      id: TEAM_ID,
      TeamUser: [],
      Invite: [
        {
          id: "owner-invite-1",
          email: "owner@example.com",
          role: Role.OWNER,
        },
      ],
    });

    await expect(
      service.deleteTeamMember(ADMIN, TEAM_ID, "owner@example.com"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.invite.delete).not.toHaveBeenCalled();
  });

  it("revokes team access immediately after member removal", async () => {
    const { service, prisma, socketAccess } = manager(Role.ADMIN);
    prisma.team.findUniqueOrThrow.mockResolvedValue({
      id: TEAM_ID,
      TeamUser: [
        {
          user_id: "member-1",
          role: Role.USER,
          User: { id: "member-1", email: "member@example.com" },
        },
      ],
      Invite: [],
    });

    await service.deleteTeamMember(ADMIN, TEAM_ID, "member@example.com");

    expect(prisma.teamUsers.delete).toHaveBeenCalled();
    expect(socketAccess.revokeUser).toHaveBeenCalledWith(TEAM_ID, "member-1");
    expect(prisma.teamUsers.delete.mock.invocationCallOrder[0]).toBeLessThan(
      socketAccess.revokeUser.mock.invocationCallOrder[0],
    );
  });

  it("revokes all team socket access after team deletion", async () => {
    const { service, prisma, socketAccess } = setup();

    await service.deleteTeam(TEAM_ID);

    expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: TEAM_ID } });
    expect(socketAccess.revokeTeam).toHaveBeenCalledWith(TEAM_ID);
    expect(prisma.team.delete.mock.invocationCallOrder[0]).toBeLessThan(
      socketAccess.revokeTeam.mock.invocationCallOrder[0],
    );
  });
});
