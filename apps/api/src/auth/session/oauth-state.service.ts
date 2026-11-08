import { Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import {
  cookieOptions,
  GOOGLE_COOKIE_PATH,
  readCookie,
  STATE_COOKIE,
} from "./auth-cookies";
import { hashSecret, secret } from "./auth-session.service";

@Injectable()
export class OAuthStateService {
  constructor(private readonly prisma: PrismaService) {}

  async begin(response: Response): Promise<string> {
    const state = secret();
    const binding = secret();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.oAuthState.deleteMany({
      where: { expires_at: { lte: new Date() } },
    });
    await this.prisma.oAuthState.create({
      data: {
        hash: hashSecret(state),
        binding_hash: hashSecret(binding),
        expires_at: expires,
      },
    });
    response.cookie(STATE_COOKIE, binding, {
      ...cookieOptions(GOOGLE_COOKIE_PATH),
      expires,
    });
    return state;
  }

  async consume(request: Request, state: unknown): Promise<boolean> {
    const binding = readCookie(request, STATE_COOKIE);
    if (
      typeof state !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(state) ||
      !binding ||
      !/^[A-Za-z0-9_-]{43}$/.test(binding)
    )
      return false;
    const result = await this.prisma.oAuthState.deleteMany({
      where: {
        hash: hashSecret(state),
        binding_hash: hashSecret(binding),
        expires_at: { gt: new Date() },
      },
    });
    return result.count === 1;
  }

  // Passport calls verify BEFORE exchanging the authorization code.
  verify(
    request: Request,
    state: string,
    callback: (error: Error | null, ok?: boolean) => void,
  ): void {
    this.consume(request, state)
      .then((ok) => callback(null, ok))
      .catch(() => callback(new Error("OAuth state verification failed")));
  }
}
