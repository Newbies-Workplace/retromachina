import { BadRequestException } from "@nestjs/common";
import {
  DEFAULT_WARMUPS,
  getEffectiveWarmups,
  validateWarmupLink,
} from "./warmup-links";

describe("warmup links", () => {
  test("uses defaults when a team has no custom links", async () => {
    const prisma = {
      warmupLink: { findMany: jest.fn().mockResolvedValue([]) },
    };

    await expect(getEffectiveWarmups(prisma as never, "team")).resolves.toEqual(
      DEFAULT_WARMUPS,
    );
    expect(DEFAULT_WARMUPS).toContainEqual({
      id: "default-openguessr",
      name: "OpenGuessr",
      description: "Wspólne zgadywanie lokalizacji z całego świata.",
      url: "https://openguessr.com/multiplayer/host",
      source: "default",
    });
    expect(DEFAULT_WARMUPS).toContainEqual({
      id: "default-haxball",
      name: "HaxBall",
      description: "Zespołowa piłka nożna połączona z air hockeyem.",
      url: "https://www.haxball.com/play",
      source: "default",
    });
    expect(DEFAULT_WARMUPS).toContainEqual({
      id: "default-giphy",
      name: "GIPHY",
      description:
        "Jakim GIF-em dziś jesteś? Wybierz GIF opisujący Twój nastrój.",
      url: "https://giphy.com/",
      source: "default",
    });
  });

  test("custom links are appended to defaults", async () => {
    const custom = {
      id: "custom",
      team_id: "team",
      name: "Custom",
      description: null,
      url: "https://example.com/",
    };
    const prisma = {
      warmupLink: { findMany: jest.fn().mockResolvedValue([custom]) },
    };

    await expect(getEffectiveWarmups(prisma as never, "team")).resolves.toEqual(
      [
        ...DEFAULT_WARMUPS,
        {
          id: "custom",
          name: "Custom",
          description: null,
          url: "https://example.com/",
          source: "team",
        },
      ],
    );
  });

  test("accepts only HTTP and HTTPS links", () => {
    expect(() =>
      validateWarmupLink({ name: "Unsafe", url: "javascript:alert(1)" }),
    ).toThrow(BadRequestException);
    expect(
      validateWarmupLink({ name: " Safe ", url: "https://example.com" }),
    ).toMatchObject({ name: "Safe", url: "https://example.com/" });
  });
});
