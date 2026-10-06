import { UserController } from "./user.controller";

jest.mock("../../prisma/prisma.service", () => ({ PrismaService: class {} }));
jest.mock("../../auth/auth.ability", () => ({ AuthAbilityFactory: class {} }));

describe("current user's organizations", () => {
  const prismaService = { user: { findUnique: jest.fn() } };
  const controller = new UserController(prismaService as never, {} as never);
  const user = {
    id: "user",
    google_id: "google-user",
    nick: "Example",
    email: "user@example.com",
    teams: [],
  };

  beforeEach(() => jest.resetAllMocks());

  it("returns memberships and roles for the authenticated user", async () => {
    prismaService.user.findUnique.mockResolvedValue({
      ...user,
      avatar_link: "avatar",
      TeamUsers: [],
      OrganizationUsers: [
        {
          organization_id: "organization",
          user_id: user.id,
          role: "ADMIN",
          Organization: {
            id: "organization",
            name: "Example organization",
            slug: "example",
            created_at: new Date(),
          },
        },
      ],
    });
    const response = await controller.getUser(user);
    expect(response.organizations).toEqual([
      {
        id: "organization",
        name: "Example organization",
        slug: "example",
        role: "ADMIN",
      },
    ]);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { google_id: user.google_id },
      include: {
        OrganizationUsers: {
          include: { Organization: true },
          orderBy: { Organization: { name: "asc" } },
        },
        TeamUsers: { include: { Team: true } },
      },
    });
  });

  it("keeps users without organizations supported", async () => {
    prismaService.user.findUnique.mockResolvedValue({
      ...user,
      avatar_link: "avatar",
      TeamUsers: [],
      OrganizationUsers: [],
    });
    expect((await controller.getUser(user)).organizations).toEqual([]);
  });
});
