import { AuthService } from "./auth.service";

jest.mock("src/prisma/prisma.service", () => ({ PrismaService: class {} }), {
  virtual: true,
});

describe("AuthService", () => {
  const googleUser = {
    id: "google-id",
    email: "user@example.com",
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
    invite: { findMany: jest.fn() },
    teamUsers: { create: jest.fn() },
  };
  const jwtService = { sign: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(jwtService as never, prismaService as never);
  });

  it("updates the name and avatar of an existing Google user", async () => {
    prismaService.user.findFirst.mockResolvedValue(existingUser);
    prismaService.user.update.mockResolvedValue(updatedUser);
    jwtService.sign.mockReturnValue("token");

    await service.googleAuth(googleUser);

    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: existingUser.id },
      data: {
        nick: "New Name",
        avatar_link: googleUser.picture,
      },
    });
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        user: {
          id: updatedUser.id,
          nick: updatedUser.nick,
          email: updatedUser.email,
          google_id: googleUser.id,
        },
      },
      { secret: process.env.JWT_SECRET },
    );
  });
});
