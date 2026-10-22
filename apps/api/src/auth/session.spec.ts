import type { Request } from "express";
import {
  extractSessionCookie,
  isAllowedOrigin,
  sessionCookieOptions,
} from "./session";

describe("shared organization session", () => {
  const originalEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it.each([
    "https://retromachine.eu",
    "https://example.retromachine.eu",
    "https://a-2.retromachine.eu",
  ])("allows %s", (origin) => {
    expect(isAllowedOrigin(origin)).toBe(true);
  });

  it.each([
    "https://retromachine.eu.evil.test",
    "https://a.b.retromachine.eu",
    "https://evil-retromachine.eu",
    "http://example.retromachine.eu",
    "https://example.retromachine.eu:444",
  ])("rejects %s", (origin) => {
    expect(isAllowedOrigin(origin)).toBe(false);
  });

  it("supports local organization origins only in development", () => {
    process.env.NODE_ENV = "development";
    expect(isAllowedOrigin("http://example.localhost:8080")).toBe(true);
    process.env.NODE_ENV = "production";
    expect(isAllowedOrigin("http://example.localhost:8080")).toBe(false);
  });

  it("keeps the session cookie HttpOnly and Secure in production", () => {
    process.env.NODE_ENV = "production";
    expect(sessionCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/rest/v1",
    });
  });

  it("rejects cookie authentication from an untrusted origin", () => {
    const request = {
      get: () => "https://evil.test",
      cookies: { retro_session: "token" },
    };
    expect(extractSessionCookie(request as unknown as Request)).toBeNull();
  });
  it("supports cross-site localhost development with Secure SameSite=None", () => {
    process.env.NODE_ENV = "development";
    expect(
      sessionCookieOptions({ hostname: "localhost" } as Request),
    ).toMatchObject({ secure: true, sameSite: "none" });
  });
});
