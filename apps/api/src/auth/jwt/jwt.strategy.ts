import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JWTUser, Token } from "src/auth/jwt/JWTUser";
import { PrismaService } from "src/prisma/prisma.service";
import {
  AccessTokenService,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from "../session/access-token.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prismaService: PrismaService,
    private readonly access: AccessTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: Token): Promise<JWTUser> {
    const claims = this.access.validateClaims(payload);
    await this.access.assertSession(claims);
    const user = await this.prismaService.user.findFirst({
      where: {
        google_id: payload.user.google_id,
      },
      include: {
        TeamUsers: {
          select: {
            team_id: true,
            role: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException();
    this.access.validateClaims(claims);

    return {
      ...user,
      auth: claims,
      teams: user.TeamUsers.map((teamUser) => ({
        id: teamUser.team_id,
        role: teamUser.role,
      })),
    };
  }
}
