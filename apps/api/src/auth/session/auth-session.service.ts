import { createHash, randomBytes } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { User } from "generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  ACCESS_TTL_SECONDS,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from "./access-token.service";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const hashSecret = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const secret = () => randomBytes(32).toString("base64url");
const validSecret = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private issue(
    user: User,
    sessionId: string,
    sessionExpiresAt: Date,
    refreshToken: string,
  ) {
    const expiresAt = Math.min(
      Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS,
      Math.floor(sessionExpiresAt.getTime() / 1000),
    );
    const accessToken = this.jwt.sign(
      {
        sid: sessionId,
        exp: expiresAt,
        user: {
          id: user.id,
          nick: user.nick,
          email: user.email,
          google_id: user.google_id,
        },
      },
      {
        secret: process.env.JWT_SECRET,
        algorithm: "HS256",
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      },
    );
    return {
      access_token: accessToken,
      expires_at: expiresAt * 1000,
      refresh_token: refreshToken,
      session_expires_at: sessionExpiresAt,
    };
  }

  async create(user: User) {
    const refreshToken = secret();
    const session = await this.prisma.authSession.create({
      data: {
        user_id: user.id,
        expires_at: new Date(Date.now() + SESSION_TTL_MS),
        RefreshTokens: { create: { hash: hashSecret(refreshToken) } },
      },
    });
    return this.issue(user, session.id, session.expires_at, refreshToken);
  }

  async refresh(raw: unknown) {
    if (!validSecret(raw)) throw new UnauthorizedException();
    const hash = hashSecret(raw);
    const record = await this.prisma.authRefreshToken.findUnique({
      where: { hash },
      include: { Session: { include: { User: true } } },
    });
    if (
      !record ||
      record.Session.revoked_at ||
      record.Session.expires_at.getTime() <= Date.now()
    )
      throw new UnauthorizedException();
    if (record.used_at) {
      await this.revoke(record.session_id);
      throw new UnauthorizedException();
    }
    const refreshToken = secret();
    const claimed = await this.prisma.$transaction(async (tx) => {
      const result = await tx.authRefreshToken.updateMany({
        where: {
          hash,
          used_at: null,
          Session: { revoked_at: null, expires_at: { gt: new Date() } },
        },
        data: { used_at: new Date() },
      });
      if (result.count !== 1) return false;
      await tx.authRefreshToken.create({
        data: { hash: hashSecret(refreshToken), session_id: record.session_id },
      });
      return true;
    });
    if (!claimed) {
      await this.revoke(record.session_id);
      throw new UnauthorizedException();
    }
    return this.issue(
      record.Session.User,
      record.session_id,
      record.Session.expires_at,
      refreshToken,
    );
  }

  async logout(raw: unknown) {
    if (!validSecret(raw)) return;
    const token = await this.prisma.authRefreshToken.findUnique({
      where: { hash: hashSecret(raw) },
      select: { session_id: true },
    });
    if (token) await this.revoke(token.session_id);
  }

  private async revoke(id: string) {
    await this.prisma.authSession.updateMany({
      where: { id },
      data: { revoked_at: new Date() },
    });
  }
}
