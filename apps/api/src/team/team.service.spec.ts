import { ForbiddenException } from "@nestjs/common";
import { TeamService } from "./team.service";

jest.mock(
  "generated/prisma/client",
  () => ({ Role: { OWNER: "OWNER", ADMIN: "ADMIN", USER: "USER" } }),
  { virtual: true },
);
jest.mock("src/prisma/prisma.service", () => ({ PrismaService: class {} }), {
  virtual: true,
});
jest.mock("../retro/application/retro.gateway", () => ({
  RetroGateway: class {},
}));

describe("organization team creation and transfer", () => {
  const tx = {
    team: { create: jest.fn(), update: jest.fn() },
    teamUsers: { findUnique: jest.fn() },
    organizationUsers: { findUnique: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
  const service = new TeamService(prisma as never, {} as never);
  const user = {
    id: "user",
    teams: [],
    nick: "User",
    email: "user@example.com",
    google_id: "google",
  };
  const team = {
    id: "team",
    name: "Original",
    slug: "original",
    organization_id: "old-org",
  };
  beforeEach(() => {
    jest.clearAllMocks();
    tx.organizationUsers.findUnique.mockResolvedValue({ role: "ADMIN" });
    tx.teamUsers.findUnique.mockResolvedValue({ role: "OWNER" });
  });

  it("allocates a suffix when the database reports a concurrent slug collision", async () => {
    tx.team.create
      .mockRejectedValueOnce({
        code: "P2002",
        meta: {
          driverAdapterError: {
            cause: { constraint: { index: "Team_organization_id_slug_key" } },
          },
        },
      })
      .mockResolvedValueOnce({ id: "team", slug: "zespol-2" });
    await expect(
      service.createTeam(user, { name: "Zespół", organization_id: "org" }),
    ).resolves.toMatchObject({ slug: "zespol-2" });
    expect(
      tx.team.create.mock.calls.map(([request]) => request.data.slug),
    ).toEqual(["zespol", "zespol-2"]);
    expect(tx.team.create.mock.calls[0][0].data).toMatchObject({
      TeamUser: { create: { user_id: "user", role: "OWNER" } },
      Board: { create: { BoardColumns: { create: expect.any(Array) } } },
    });
  });

  it("allows a team without an organization", async () => {
    tx.team.create.mockResolvedValue({ id: "team" });
    await service.createTeam(user, { name: "Standalone" });
    expect(tx.organizationUsers.findUnique).not.toHaveBeenCalled();
    expect(tx.team.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: null,
          slug: "standalone",
        }),
      }),
    );
  });

  it("rejects creation by an ordinary organization member", async () => {
    tx.organizationUsers.findUnique.mockResolvedValue({ role: "USER" });
    await expect(
      service.createTeam(user, { name: "Team", organization_id: "org" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.team.create).not.toHaveBeenCalled();
  });

  it("keeps the slug when renaming a team", async () => {
    tx.team.update.mockResolvedValue(team);
    await service.editTeam(user, team as never, { name: "New name" });
    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: "team" },
      data: {
        name: "New name",
        slug: "original",
        organization_id: "old-org",
        invite_key: null,
      },
    });
  });

  it("rejects moving a team by its administrator", async () => {
    tx.teamUsers.findUnique.mockResolvedValue({ role: "ADMIN" });
    await expect(
      service.editTeam(user, team as never, {
        name: "Team",
        organization_id: "org",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.team.update).not.toHaveBeenCalled();
  });

  it("rejects moving to an organization without administrative membership", async () => {
    tx.organizationUsers.findUnique.mockResolvedValue(null);
    await expect(
      service.editTeam(user, team as never, {
        name: "Team",
        organization_id: "org",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allocates a suffix when moving into an occupied slug", async () => {
    tx.team.update
      .mockRejectedValueOnce({
        code: "P2002",
        meta: { target: ["organization_id", "slug"] },
      })
      .mockResolvedValueOnce({ ...team, slug: "original-2" });
    await expect(
      service.editTeam(user, team as never, {
        name: "Team",
        organization_id: "org",
      }),
    ).resolves.toMatchObject({ slug: "original-2" });
  });
});
