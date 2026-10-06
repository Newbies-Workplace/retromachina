import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";

export const ACCESS_TTL_SECONDS = 15 * 60;
export const JWT_ISSUER = "retromachina";
export const JWT_AUDIENCE = "retromachina-api";
export type AccessClaims = {
  exp: number;
  sid: string;
  user: { id: string; google_id: string };
};

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  validateClaims(value: unknown): AccessClaims {
    return validateAccessClaims(value);
  }
  verify(token: unknown): AccessClaims {
    return verifyAccessToken(this.jwt, token);
  }

  async assertSession(claims: AccessClaims): Promise<void> {
    this.validateClaims(claims);
    const session = await this.prisma.authSession.findFirst({
      where: {
        id: claims.sid,
        user_id: claims.user.id,
        revoked_at: null,
        expires_at: { gt: new Date() },
        User: { google_id: claims.user.google_id },
      },
      select: { id: true },
    });
    if (!session) throw new UnauthorizedException();
    this.validateClaims(claims);
  }
}

export function validateAccessClaims(value: unknown): AccessClaims {
  const claims = value as Partial<AccessClaims> | null;
  if (
    !claims ||
    !Number.isSafeInteger(claims.exp) ||
    claims.exp <= Date.now() / 1000 ||
    typeof claims.sid !== "string" ||
    !claims.sid ||
    typeof claims.user?.id !== "string" ||
    !claims.user.id ||
    typeof claims.user.google_id !== "string" ||
    !claims.user.google_id
  )
    throw new UnauthorizedException();
  return claims as AccessClaims;
}
export function verifyAccessToken(
  jwt: JwtService,
  token: unknown,
): AccessClaims {
  try {
    if (typeof token !== "string" || !token) throw new Error("Missing token");
    return validateAccessClaims(
      jwt.verify(token, {
        secret: process.env.JWT_SECRET,
        algorithms: ["HS256"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }),
    );
  } catch {
    throw new UnauthorizedException();
  }
}
