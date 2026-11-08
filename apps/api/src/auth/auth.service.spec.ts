import { AuthService } from "./auth.service";

jest.mock("src/prisma/prisma.service", () => ({ PrismaService: class {} }), {
  virtual: true,
});

jest.mock("./session/auth-session.service", () => ({
  AuthSessionService: class {},
}));

describe("AuthService", () => {
  const googleUser = {
    id: "google-id",
    email: "user@example.com",
    emailVerified: true,
    firstName: "New",
    lastName: "Name",
    picture: "https://example.com/new-avatar.jpg",
  };
  const existingUser = {
    id: "user-id",
    nick: "Old Name",
    email: googleUser.email,
    avatar_link: "https://example.com/old-avatar.jpg",
    google_id: googleUser.id,
  };
  const updatedUser = {
    ...existingUser,
    nick: "New Name",
    avatar_link: googleUser.picture,
  };
  const prismaService = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    invite: { findMany: jest.fn(), delete: jest.fn() },
    teamUsers: { create: jest.fn() },
  };
  const sessions = { create: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(sessions as never, prismaService as never);
  });

  it("updates the name and avatar of an existing Google user", async () => {
    prismaService.user.findFirst.mockResolvedValue(existingUser);
    prismaService.user.update.mockResolvedValue(updatedUser);
    sessions.create.mockResolvedValue({ access_token: "token" });

    await service.googleAuth(googleUser);

    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: existingUser.id },
      data: {
        nick: "New Name",
        avatar_link: googleUser.picture,
      },
    });
    expect(sessions.create).toHaveBeenCalledWith(updatedUser);
  });

  it("accepts pending invites for a new user with a verified email", async () => {
    prismaService.user.findFirst.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue(existingUser);
    prismaService.invite.findMany.mockResolvedValue([
      { id: "invite", team_id: "team", role: "USER" },
    ]);

    await service.googleAuth(googleUser);

    expect(prismaService.teamUsers.create).toHaveBeenCalledWith({
      data: { team_id: "team", user_id: existingUser.id, role: "USER" },
    });
    expect(prismaService.invite.delete).toHaveBeenCalledWith({
      where: { id: "invite" },
    });
  });

  it("ignores pending invites when Google did not verify the email", async () => {
    prismaService.user.findFirst.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue(existingUser);
    prismaService.invite.findMany.mockResolvedValue([
      { id: "invite", team_id: "team", role: "ADMIN" },
    ]);

    await service.googleAuth({ ...googleUser, emailVerified: false });

    expect(prismaService.invite.findMany).not.toHaveBeenCalled();
    expect(prismaService.teamUsers.create).not.toHaveBeenCalled();
  });
});
