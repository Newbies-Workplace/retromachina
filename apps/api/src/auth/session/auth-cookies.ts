import { ForbiddenException } from "@nestjs/common";
import type { Request, Response } from "express";

export const REFRESH_COOKIE = "rm_refresh";
export const STATE_COOKIE = "rm_oauth_binding";
export const webOrigin = () => new URL(process.env.CALLBACK_URL).origin;
export const cookieOptions = (path: string) => ({
  httpOnly: true,
  secure: webOrigin().startsWith("https:"),
  sameSite: "lax" as const,
  path,
});
export const AUTH_COOKIE_PATH = "/api/rest/v1/auth";
export const GOOGLE_COOKIE_PATH = "/api/rest/v1/google";
export function readCookie(request: Request, name: string): string | undefined {
  const values = (request.headers.cookie ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  return values.length === 1 ? values[0].slice(name.length + 1) : undefined;
}
export function assertBrowserRequest(request: Request): void {
  if (
    request.headers.origin !== webOrigin() ||
    request.headers["x-requested-with"] !== "Retromachina"
  )
    throw new ForbiddenException();
}
export function setRefreshCookie(
  response: Response,
  value: string,
  expires: Date,
) {
  response.cookie(REFRESH_COOKIE, value, {
    ...cookieOptions(AUTH_COOKIE_PATH),
    expires,
  });
}
