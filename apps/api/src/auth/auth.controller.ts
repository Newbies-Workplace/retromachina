import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Response,
  UseGuards,
} from "@nestjs/common";
import type { Response as ExpressResponse, Request } from "express";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { AuthService } from "./auth.service";
import { GoogleUser } from "./google/GoogleUser";
import { GoogleGuard } from "./google/google.guard";
import { JWTUser } from "./jwt/JWTUser";
import { JwtGuard } from "./jwt/jwt.guard";
import {
  isAllowedOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "./session";

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
    @Req() request: Request,
  ) {
    const token = await this.authService.googleAuth(user);

    response.status(200);
    response.cookie(SESSION_COOKIE, token, sessionCookieOptions(request));
    return response.json({
      access_token: token,
    });
  }

  @UseGuards(JwtGuard)
  @Get("session")
  async session(
    @User() user: JWTUser,
    @Response() response: ExpressResponse,
    @Req() request: Request,
  ) {
    response.setHeader("Cache-Control", "no-store");
    const token = this.authService.sessionToken(user);
    response.cookie(SESSION_COOKIE, token, sessionCookieOptions(request));
    return response.json({ access_token: token });
  }

  @UseGuards(JwtGuard)
  @Post("session")
  async migrateSession(
    @User() user: JWTUser,
    @Response() response: ExpressResponse,
    @Req() request: Request,
  ) {
    const token = this.authService.sessionToken(user);
    response.cookie(SESSION_COOKIE, token, sessionCookieOptions(request));
    response.setHeader("Cache-Control", "no-store");
    return response.json({ access_token: token });
  }

  @Post("logout")
  logout(@Response() response: ExpressResponse, @Req() request: Request) {
    const origin = request.get("origin");
    if (origin && !isAllowedOrigin(origin))
      throw new ForbiddenException("Untrusted origin");
    const { maxAge: _maxAge, ...options } = sessionCookieOptions(request);
    response.clearCookie(SESSION_COOKIE, options);
    return response.status(204).send();
  }
}
