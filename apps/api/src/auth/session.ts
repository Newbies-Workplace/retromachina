import type { CookieOptions, Request } from "express";

export const SESSION_COOKIE = "retro_session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const domain = process.env.RETRO_ROOT_DOMAIN || "retromachine.eu";
    const organizationSlug = url.hostname.endsWith(`.${domain}`)
      ? url.hostname.slice(0, -domain.length - 1)
      : "";
    if (
      url.protocol === "https:" &&
      !url.port &&
      (url.hostname === domain ||
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(organizationSlug))
    )
      return true;
    if (
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) &&
      url.port === "8080"
    )
      return true;
    return (process.env.RETRO_ALLOWED_ORIGINS || "")
      .split(",")
      .includes(origin);
  } catch {
    return false;
  }
}

export function sessionCookieOptions(request?: Request): CookieOptions {
  const localDevelopment =
    process.env.NODE_ENV !== "production" && request?.hostname === "localhost";
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.RETRO_SESSION_SECURE === "true" ||
      localDevelopment,
    sameSite: localDevelopment ? "none" : "lax",
    path: "/api/rest/v1",
    maxAge: SESSION_MAX_AGE,
  };
}

export function extractSessionCookie(request: Request): string | null {
  const origin = request.get("origin");
  if (origin && !isAllowedOrigin(origin)) return null;
  return typeof request.cookies?.[SESSION_COOKIE] === "string"
    ? request.cookies[SESSION_COOKIE]
    : null;
}
