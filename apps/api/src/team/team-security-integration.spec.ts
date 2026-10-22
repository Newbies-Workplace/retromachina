import type { ExecutionContext, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { JwtGuard } from "../auth/jwt/jwt.guard";
import { PrismaService } from "../prisma/prisma.service";
import { RetroGateway } from "../retro/application/retro.gateway";
import { TeamSocketAccessService } from "../security/team-socket-access.service";
import { TeamController } from "./application/team.controller";
import { TeamService } from "./team.service";

jest.mock(
  "generated/prisma/client",
  () => ({ Role: { USER: "USER", ADMIN: "ADMIN", OWNER: "OWNER" } }),
  { virtual: true },
);
jest.mock("../prisma/prisma.service", () => ({ PrismaService: class {} }));
jest.mock(
  "src/prisma/prisma.service",
  () => jest.requireMock("../prisma/prisma.service"),
  { virtual: true },
);
jest.mock(
  "src/auth/jwt/jwt.guard",
  () => jest.requireActual("../auth/jwt/jwt.guard"),
  { virtual: true },
);
jest.mock(
  "src/auth/jwt/jwtuser.decorator",
  () => jest.requireActual("../auth/jwt/jwtuser.decorator"),
  { virtual: true },
);
jest.mock("../retro/application/retro.gateway", () => ({
  RetroGateway: class {},
}));

type Card = { id: string; team_id: string; user_id: string; text: string };
describe("team security HTTP boundary", () => {
  let app: INestApplication;
  let cards: Card[];
  let roles: Map<string, string>;
  const access = { revokeUser: jest.fn() };
  const caller = {
    id: "admin",
    teams: [
      { id: "team-a", role: "ADMIN" },
      { id: "team-b", role: "ADMIN" },
    ],
  };
  const users = [
    { id: "admin", email: "admin@example.com" },
    { id: "owner", email: "owner@example.com" },
    { id: "member", email: "member@example.com" },
  ];
  const matches = (card: Card, where: Partial<Card>) =>
    Object.entries(where).every(([key, value]) => card[key] === value);
  beforeEach(async () => {
    jest.clearAllMocks();
    cards = [
      { id: "own", team_id: "team-a", user_id: "admin", text: "Own" },
      { id: "private", team_id: "team-a", user_id: "member", text: "Private" },
      {
        id: "foreign",
        team_id: "team-b",
        user_id: "admin",
        text: "Other team",
      },
    ];
    roles = new Map([
      ["admin", "ADMIN"],
      ["owner", "OWNER"],
      ["member", "USER"],
    ]);
    const prisma = {
      team: {
        findUniqueOrThrow: async ({ where }) => ({
          id: where.id,
          TeamUser: users.map((user) => ({
            user_id: user.id,
            role: roles.get(user.id),
            User: user,
          })),
          Invite: [],
        }),
      },
      user: {
        findFirst: async ({ where }) => {
          const user = users.find((user) => user.email === where.email);
          return user
            ? { ...user, TeamUsers: [{ role: roles.get(user.id) }] }
            : null;
        },
      },
      teamUsers: {
        findUnique: async ({ where }) => {
          const role = roles.get(where.team_id_user_id.user_id);
          return role ? { role } : null;
        },
        update: async ({ where, data }) => {
          roles.set(where.team_id_user_id.user_id, data.role);
        },
      },
      reflectionCard: {
        updateMany: async ({ where, data }) => {
          let count = 0;
          for (const card of cards)
            if (matches(card, where)) {
              card.text = data.text;
              count++;
            }
          return { count };
        },
        findFirstOrThrow: async ({ where }) =>
          cards.find((card) => matches(card, where)),
        deleteMany: async ({ where }) => {
          const initial = cards.length;
          cards = cards.filter((card) => !matches(card, where));
          return { count: initial - cards.length };
        },
      },
    };
    const module = await Test.createTestingModule({
      controllers: [TeamController],
      providers: [
        TeamService,
        AuthAbilityFactory,
        { provide: PrismaService, useValue: prisma },
        { provide: RetroGateway, useValue: {} },
        { provide: TeamSocketAccessService, useValue: access },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = caller;
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.init();
  });
  afterEach(async () => {
    await app?.close();
  });

  it.each([
    "private",
    "foreign",
    "missing",
  ])("returns 404 for editing/deleting inaccessible card %s with no state change", async (id) => {
    const before = JSON.stringify(cards);
    await request(app.getHttpServer())
      .put(`/teams/team-a/reflection_cards/${id}`)
      .send({ text: "Attack" })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/teams/team-a/reflection_cards/${id}`)
      .expect(404);
    expect(JSON.stringify(cards)).toBe(before);
  });
  it("allows editing/deleting the caller's own card", async () => {
    await request(app.getHttpServer())
      .put("/teams/team-a/reflection_cards/own")
      .send({ text: "Allowed" })
      .expect(200, { id: "own", text: "Allowed" });
    await request(app.getHttpServer())
      .delete("/teams/team-a/reflection_cards/own")
      .expect(200);
    expect(cards.map((card) => card.id)).toEqual(["private", "foreign"]);
  });
  it("blocks self-promotion and owner changes/removal", async () => {
    for (const email of ["admin@example.com", "member@example.com"]) {
      await request(app.getHttpServer())
        .put("/teams/team-a/members")
        .send({ email, role: "OWNER" })
        .expect(403);
    }
    await request(app.getHttpServer())
      .put("/teams/team-a/members")
      .send({ email: "owner@example.com", role: "USER" })
      .expect(403);
    await request(app.getHttpServer())
      .delete("/teams/team-a/members/owner@example.com")
      .expect(403);
    expect(roles.get("owner")).toBe("OWNER");
    expect(roles.get("admin")).toBe("ADMIN");
  });
  it("uses current database permissions and allows a valid promotion with socket revocation", async () => {
    roles.set("admin", "USER");
    await request(app.getHttpServer())
      .put("/teams/team-a/members")
      .send({ email: "member@example.com", role: "ADMIN" })
      .expect(403);
    expect(roles.get("member")).toBe("USER");
    roles.set("admin", "ADMIN");
    await request(app.getHttpServer())
      .put("/teams/team-a/members")
      .send({ email: "member@example.com", role: "ADMIN" })
      .expect(200);
    expect(roles.get("member")).toBe("ADMIN");
    expect(access.revokeUser).toHaveBeenCalledWith("team-a", "member");
  });
});
