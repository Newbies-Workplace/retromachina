import { Controller, Get, Response, UseGuards } from "@nestjs/common";
import type { Response as ExpressResponse } from "express";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { AuthService } from "./auth.service";
import { GoogleUser } from "./google/GoogleUser";
import { GoogleGuard } from "./google/google.guard";
import {
  cookieOptions,
  GOOGLE_COOKIE_PATH,
  STATE_COOKIE,
  setRefreshCookie,
} from "./session/auth-cookies";

@Controller("google")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(GoogleGuard)
  @Get("redirect")
  async googleAuth() {}

  @UseGuards(GoogleGuard)
  @Get("login")
  async googleLogin(
    @User() user: GoogleUser,
    @Response() response: ExpressResponse,
  ) {
    const session = await this.authService.googleAuth(user);
    setRefreshCookie(
      response,
      session.refresh_token,
      session.session_expires_at,
    );
    response.clearCookie(STATE_COOKIE, cookieOptions(GOOGLE_COOKIE_PATH));
    response.setHeader("Cache-Control", "no-store");

    response.status(200);
    return response.json({
      access_token: session.access_token,
      expires_at: session.expires_at,
    });
  }
}
