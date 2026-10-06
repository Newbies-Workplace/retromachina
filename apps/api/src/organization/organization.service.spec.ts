import { ForbiddenException } from "@nestjs/common";
import { OrganizationService } from "./organization.service";

jest.mock(
  "generated/prisma/client",
  () => ({
    Role: { OWNER: "OWNER", ADMIN: "ADMIN", USER: "USER" },
  }),
  { virtual: true },
);
jest.mock("../prisma/prisma.service", () => ({ PrismaService: class {} }));

describe("OrganizationService access", () => {
  const prismaService = {
    organizationUsers: { findUnique: jest.fn(), findMany: jest.fn() },
  };
  const service = new OrganizationService(prismaService as never);
  const membership = {
    user_id: "user",
    organization_id: "organization",
    role: "USER",
    Organization: { id: "organization", name: "Example", slug: "example" },
  };

  beforeEach(() => jest.resetAllMocks());

  it("rejects access without organization membership", async () => {
    prismaService.organizationUsers.findUnique.mockResolvedValue(null);
    await expect(
      service.requireMembership("outsider", "organization"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaService.organizationUsers.findUnique).toHaveBeenCalledWith({
      where: {
        organization_id_user_id: {
          organization_id: "organization",
          user_id: "outsider",
        },
      },
      include: { Organization: true },
    });
  });

  it("allows a member to read their organization", async () => {
    prismaService.organizationUsers.findUnique.mockResolvedValue(membership);
    await expect(
      service.requireMembership("user", "organization"),
    ).resolves.toEqual(membership);
  });

  it("rejects a member when an administrator role is required", async () => {
    prismaService.organizationUsers.findUnique.mockResolvedValue(membership);
    await expect(
      service.requireMembership("user", "organization", ["ADMIN", "OWNER"]),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("lists only the requesting user's memberships", async () => {
    prismaService.organizationUsers.findMany.mockResolvedValue([membership]);
    await expect(service.listForUser("user")).resolves.toEqual([
      {
        ...membership.Organization,
        role: "USER",
      },
    ]);
    expect(prismaService.organizationUsers.findMany).toHaveBeenCalledWith({
      where: { user_id: "user" },
      include: { Organization: true },
      orderBy: { Organization: { name: "asc" } },
    });
  });
});
