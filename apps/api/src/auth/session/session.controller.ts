import { Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import {
  AUTH_COOKIE_PATH,
  assertBrowserRequest,
  cookieOptions,
  REFRESH_COOKIE,
  readCookie,
  setRefreshCookie,
} from "./auth-cookies";
import { AuthSessionService } from "./auth-session.service";

@Controller("auth")
export class SessionController {
  constructor(private readonly sessions: AuthSessionService) {}
  @Post("refresh")
  async refresh(@Req() request: Request, @Res() response: Response) {
    assertBrowserRequest(request);
    const session = await this.sessions.refresh(
      readCookie(request, REFRESH_COOKIE),
    );
    setRefreshCookie(
      response,
      session.refresh_token,
      session.session_expires_at,
    );
    response.setHeader("Cache-Control", "no-store");
    return response.json({
      access_token: session.access_token,
      expires_at: session.expires_at,
    });
  }
  @Post("logout")
  async logout(@Req() request: Request, @Res() response: Response) {
    assertBrowserRequest(request);
    await this.sessions.logout(readCookie(request, REFRESH_COOKIE));
    response.clearCookie(REFRESH_COOKIE, cookieOptions(AUTH_COOKIE_PATH));
    return response.status(204).send();
  }
}
