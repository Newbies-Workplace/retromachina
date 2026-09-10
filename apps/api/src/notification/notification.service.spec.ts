import type { MessageEvent } from "@nestjs/common";
import type { RetroStartedEvent } from "shared/model/notification/notification.events";
import { NotificationService } from "./notification.service";

jest.mock("../prisma/prisma.service", () => ({ PrismaService: class {} }));

describe("NotificationService", () => {
  const event: RetroStartedEvent = {
    retroId: "retro-id",
    teamId: "team-id",
    teamName: "Team",
    startedAt: "2026-09-10T10:00:00.000Z",
  };

  const prismaService = {
    teamUsers: { findMany: jest.fn() },
  };
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService(prismaService as never);
  });

  it("emits to every connected session of a team member", async () => {
    prismaService.teamUsers.findMany.mockResolvedValue([
      { user_id: "recipient" },
    ]);
    const firstSession = jest.fn<void, [MessageEvent]>();
    const secondSession = jest.fn<void, [MessageEvent]>();
    service.subscribe("recipient").subscribe(firstSession);
    service.subscribe("recipient").subscribe(secondSession);

    await service.notifyTeamRetroStarted("team-id", "initiator", event);

    expect(firstSession).toHaveBeenCalledWith({
      type: "retro-started",
      data: event,
    });
    expect(secondSession).toHaveBeenCalledWith({
      type: "retro-started",
      data: event,
    });
  });

  it("queries only team members other than the initiator", async () => {
    prismaService.teamUsers.findMany.mockResolvedValue([]);

    await service.notifyTeamRetroStarted("team-id", "initiator", event);

    expect(prismaService.teamUsers.findMany).toHaveBeenCalledWith({
      where: {
        team_id: "team-id",
        user_id: { not: "initiator" },
      },
      select: { user_id: true },
    });
  });

  it("stops emitting after a session disconnects", async () => {
    prismaService.teamUsers.findMany.mockResolvedValue([
      { user_id: "recipient" },
    ]);
    const listener = jest.fn<void, [MessageEvent]>();
    const subscription = service.subscribe("recipient").subscribe(listener);
    subscription.unsubscribe();

    await service.notifyTeamRetroStarted("team-id", "initiator", event);

    expect(listener).not.toHaveBeenCalled();
  });
});
