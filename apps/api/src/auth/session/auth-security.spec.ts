import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthController } from "../auth.controller";
import { GoogleStrategy } from "../google/google.strategy";
import { JwtStrategy } from "../jwt/jwt.strategy";
import {
  AccessTokenService,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from "./access-token.service";
import { AuthSessionService, hashSecret } from "./auth-session.service";
import { OAuthStateService } from "./oauth-state.service";
import { SessionController } from "./session.controller";

jest.mock("src/prisma/prisma.service", () => ({ PrismaService: class {} }), {
  virtual: true,
});
jest.mock("src/auth/jwt/JWTUser", () => ({}), { virtual: true });
jest.mock("src/auth/jwt/jwtuser.decorator", () => ({ User: () => () => {} }), {
  virtual: true,
});
jest.mock("../../prisma/prisma.service", () => ({ PrismaService: class {} }));

// Shared records model two API instances; predicates execute atomically before resolving.
const setup = () => {
  const user = {
    id: "u",
    google_id: "g",
    nick: "Member",
    email: "u@example.com",
  };
  const states = new Map<
    string,
    { hash: string; binding_hash: string; expires_at: Date }
  >();
  const sessions = new Map<
    string,
    { id: string; user_id: string; expires_at: Date; revoked_at?: Date }
  >();
  const tokens = new Map<
    string,
    { hash: string; session_id: string; used_at: Date | null }
  >();
  const prisma = {
    oAuthState: {
      create: async ({ data }) => {
        states.set(data.hash, data);
        return data;
      },
      deleteMany: async ({ where }) => {
        let count = 0;
        for (const [id, item] of states) {
          if (
            where.hash &&
            (id !== where.hash || item.binding_hash !== where.binding_hash)
          )
            continue;
          if (where.expires_at.gt && item.expires_at <= where.expires_at.gt)
            continue;
          if (where.expires_at.lte && item.expires_at > where.expires_at.lte)
            continue;
          states.delete(id);
          count++;
        }
        return { count };
      },
    },
    authSession: {
      create: async ({ data }) => {
        const session = {
          id: String(sessions.size + 1),
          user_id: data.user_id,
          expires_at: data.expires_at,
        };
        sessions.set(session.id, session);
        tokens.set(data.RefreshTokens.create.hash, {
          hash: data.RefreshTokens.create.hash,
          session_id: session.id,
          used_at: null,
        });
        return session;
      },
      findFirst: async ({ where }) => {
        const session = sessions.get(where.id);
        return session &&
          !session.revoked_at &&
          session.expires_at > new Date() &&
          session.user_id === where.user_id &&
          where.User.google_id === user.google_id
          ? session
          : null;
      },
      updateMany: async ({ where, data }) => {
        const item = sessions.get(where.id);
        if (!item) return { count: 0 };
        Object.assign(item, data);
        return { count: 1 };
      },
    },
    authRefreshToken: {
      findUnique: async ({ where }) => {
        const token = tokens.get(where.hash);
        return token
          ? {
              ...token,
              Session: { ...sessions.get(token.session_id), User: user },
            }
          : null;
      },
      updateMany: async ({ where, data }) => {
        const token = tokens.get(where.hash);
        const session = token && sessions.get(token.session_id);
        if (
          !token ||
          token.used_at ||
          session.revoked_at ||
          session.expires_at <= new Date()
        )
          return { count: 0 };
        Object.assign(token, data);
        return { count: 1 };
      },
      create: async ({ data }) => {
        tokens.set(data.hash, { ...data, used_at: null });
        return data;
      },
    },
    $transaction: async (callback) => callback(prisma),
  };
  return {
    user,
    prisma: prisma as unknown as PrismaService,
    sessions,
    tokens,
    states,
  };
};
const request = (binding?: string) =>
  ({
    headers: { cookie: binding ? `rm_oauth_binding=${binding}` : "" },
  }) as Request;

const previous = {
  secret: process.env.JWT_SECRET,
  client: process.env.GOOGLE_CLIENT_ID,
  google: process.env.GOOGLE_SECRET,
  callback: process.env.CALLBACK_URL,
};
beforeAll(() => {
  process.env.JWT_SECRET = "synthetic-test-secret";
  process.env.GOOGLE_CLIENT_ID = "synthetic-client";
  process.env.GOOGLE_SECRET = "synthetic-google-secret";
  process.env.CALLBACK_URL = "http://localhost:8080/loading";
});
afterAll(() => {
  for (const [key, value] of Object.entries({
    JWT_SECRET: previous.secret,
    GOOGLE_CLIENT_ID: previous.client,
    GOOGLE_SECRET: previous.google,
    CALLBACK_URL: previous.callback,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("OAuth state across instances", () => {
  const begin = async (states: OAuthStateService) => {
    let binding: string;
    const response = {
      cookie: (_name: string, value: string) => {
        binding = value;
      },
    } as Response;
    const state = await states.begin(response);
    return { state, binding };
  };
  it("rejects missing, changed, expired and wrong-browser state; consumes valid state only once", async () => {
    const store = setup();
    const a = new OAuthStateService(store.prisma);
    const b = new OAuthStateService(store.prisma);
    const { state, binding } = await begin(a);
    expect(await b.consume(request(), state)).toBe(false);
    expect(await b.consume(request(binding), "changed")).toBe(false);
    expect(await b.consume(request("X".repeat(43)), state)).toBe(false);
    const results = await Promise.all([
      a.consume(request(binding), state),
      b.consume(request(binding), state),
    ]);
    expect(results.sort()).toEqual([false, true]);
    expect(await a.consume(request(binding), state)).toBe(false);
    const expired = await begin(a);
    store.states.get(hashSecret(expired.state)).expires_at = new Date(
      Date.now() - 1,
    );
    expect(await b.consume(request(expired.binding), expired.state)).toBe(
      false,
    );
  });
  it("Passport verifies state before exchanging the code", async () => {
    const store = setup();
    const states = new OAuthStateService(store.prisma);
    const { state, binding } = await begin(states);
    const strategy = new GoogleStrategy(states);
    const exchange = jest.fn((_code, _options, callback) =>
      callback(new Error("synthetic exchange reached")),
    );
    strategy["_oauth2"].getOAuthAccessToken =
      exchange as unknown as (typeof strategy)["_oauth2"]["getOAuthAccessToken"];
    const authenticate = (stateValue: string, cookie: string) =>
      new Promise<void>((resolve) => {
        strategy.fail = () => resolve();
        strategy.error = () => resolve();
        strategy.authenticate({
          ...request(cookie),
          query: { code: "synthetic-code", state: stateValue },
        } as unknown as Request);
      });
    await authenticate(state, "X".repeat(43));
    expect(exchange).not.toHaveBeenCalled();
    await authenticate(state, binding);
    expect(exchange).toHaveBeenCalledTimes(1);
    await authenticate(state, binding);
    expect(exchange).toHaveBeenCalledTimes(1);
  });
});

describe("bounded access and rotating refresh sessions", () => {
  it("issues bounded tokens and consistently rejects missing exp, expired, wrong issuer/audience/algorithm tokens", async () => {
    const store = setup();
    const jwt = new JwtService();
    const sessions = new AuthSessionService(store.prisma, jwt);
    const access = new AccessTokenService(jwt, store.prisma);
    const issued = await sessions.create(store.user as never);
    const claims = access.verify(issued.access_token);
    expect(claims.exp * 1000 - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000);
    await expect(access.assertSession(claims)).resolves.toBeUndefined();
    const payload = { sid: claims.sid, user: claims.user };
    for (const options of [
      {},
      { expiresIn: -1 },
      { expiresIn: 60, issuer: "wrong" },
      { expiresIn: 60, audience: "wrong" },
      { expiresIn: 60, algorithm: "HS384" },
    ]) {
      const token = jwt.sign(payload, {
        secret: process.env.JWT_SECRET,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        ...options,
      } as never);
      expect(() => access.verify(token)).toThrow();
    }
  });
  it("renews on another instance, rotates refresh tokens, detects replay and revokes the family", async () => {
    const store = setup();
    const jwt = new JwtService();
    const a = new AuthSessionService(store.prisma, jwt);
    const b = new AuthSessionService(store.prisma, jwt);
    const access = new AccessTokenService(jwt, store.prisma);
    const first = await a.create(store.user as never);
    const second = await b.refresh(first.refresh_token);
    expect(second.refresh_token).not.toBe(first.refresh_token);
    expect(second.session_expires_at).toEqual(first.session_expires_at);
    await expect(
      access.assertSession(access.verify(second.access_token)),
    ).resolves.toBeUndefined();
    await expect(a.refresh(first.refresh_token)).rejects.toThrow();
    await expect(b.refresh(second.refresh_token)).rejects.toThrow();
    await expect(
      access.assertSession(access.verify(second.access_token)),
    ).rejects.toThrow();
  });
  it("rejects expired sessions, wrong secrets, concurrent replay and logout tokens", async () => {
    const store = setup();
    const jwt = new JwtService();
    const sessions = new AuthSessionService(store.prisma, jwt);
    const first = await sessions.create(store.user as never);
    await expect(sessions.refresh("X".repeat(43))).rejects.toThrow();
    const results = await Promise.allSettled([
      sessions.refresh(first.refresh_token),
      sessions.refresh(first.refresh_token),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect([...store.sessions.values()][0].revoked_at).toBeInstanceOf(Date);
    const next = await sessions.create(store.user as never);
    await sessions.logout(next.refresh_token);
    await expect(sessions.refresh(next.refresh_token)).rejects.toThrow();
    const expired = await sessions.create(store.user as never);
    const claims = new AccessTokenService(jwt, store.prisma).verify(
      expired.access_token,
    );
    store.sessions.get(claims.sid).expires_at = new Date(Date.now() - 1);
    await expect(sessions.refresh(expired.refresh_token)).rejects.toThrow();
  });
});

describe("HTTP login and session endpoints", () => {
  const response = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn(),
  });
  it("accepts Google login, sends only bounded access credentials and sets protected refresh cookie", async () => {
    const store = setup();
    const sessions = new AuthSessionService(store.prisma, new JwtService());
    const controller = new AuthController({
      googleAuth: () => sessions.create(store.user as never),
    } as never);
    const res = response();
    await controller.googleLogin({} as never, res as never);
    expect(res.cookie).toHaveBeenCalledWith(
      "rm_refresh",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api/rest/v1/auth",
      }),
    );
    const data = res.json.mock.calls[0][0];
    expect(data.expires_at).toBeGreaterThan(Date.now());
    expect(data.refresh_token).toBeUndefined();
    const access = new AccessTokenService(new JwtService(), store.prisma);
    const users = {
      ...store.prisma,
      user: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ ...store.user, TeamUsers: [] }),
      },
    };
    const strategy = new JwtStrategy(users as never, access) as JwtStrategy & {
      authenticate: (request: Request) => void;
      success: () => void;
      fail: () => void;
      error: () => void;
    };
    const authenticate = (token: string) =>
      new Promise<boolean>((resolve) => {
        strategy.success = () => resolve(true);
        strategy.fail = () => resolve(false);
        strategy.error = () => resolve(false);
        strategy.authenticate({
          headers: { authorization: `Bearer ${token}` },
        } as unknown as Request);
      });
    expect(await authenticate(data.access_token)).toBe(true);
    const claims = access.verify(data.access_token);
    const { exp: _exp, ...withoutExpiry } = claims;
    const jwt = new JwtService();
    const options = {
      secret: process.env.JWT_SECRET,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    };
    expect(
      await authenticate(jwt.sign(withoutExpiry, { secret: options.secret })),
    ).toBe(false);
    expect(
      await authenticate(
        jwt.sign(
          { ...claims, exp: Math.floor(Date.now() / 1000) - 1 },
          { secret: options.secret },
        ),
      ),
    ).toBe(false);
    expect(users.user.findFirst).toHaveBeenCalledTimes(1);
  });
  it("rejects cross-origin or missing-header refresh without touching the session, and rotates a valid browser session", async () => {
    const store = setup();
    const sessions = new AuthSessionService(store.prisma, new JwtService());
    const issued = await sessions.create(store.user as never);
    const controller = new SessionController(sessions);
    const req = {
      headers: {
        origin: "http://localhost:8080",
        "x-requested-with": "Retromachina",
        cookie: `rm_refresh=${issued.refresh_token}`,
      },
    } as unknown as Request;
    await expect(
      controller.refresh(
        {
          headers: { ...req.headers, origin: "https://attacker.test" },
        } as unknown as Request,
        response() as never,
      ),
    ).rejects.toThrow();
    await expect(
      controller.refresh(
        {
          headers: { ...req.headers, "x-requested-with": undefined },
        } as unknown as Request,
        response() as never,
      ),
    ).rejects.toThrow();
    expect(store.tokens.size).toBe(1);
    const res = response();
    await controller.refresh(req, res as never);
    expect(store.tokens.size).toBe(2);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        access_token: expect.any(String),
        expires_at: expect.any(Number),
      }),
    );
    const refreshToken = res.cookie.mock.calls[0][1];
    await controller.logout(
      {
        headers: { ...req.headers, cookie: `rm_refresh=${refreshToken}` },
      } as unknown as Request,
      response() as never,
    );
    await expect(sessions.refresh(refreshToken)).rejects.toThrow();
  });
});
