import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { config } from 'dotenv';
import { Token, JWTUser } from 'src/auth/jwt/JWTUser';
import { PrismaService } from 'src/prisma/prisma.service';

config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // TO BE CHANGED
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: Token): Promise<JWTUser> {
    const user = await this.prismaService.user.findFirst({
      where: {
        google_id: payload.user.google_id,
      },
      include: {
        TeamUsers: {
          select: {
            team_id: true,
            role: true,
          }
        }
      }
    });

    if (!user) throw new UnauthorizedException();

    return {
      ...user,
      teams: user.TeamUsers.map(teamUser => ({
        id: teamUser.team_id,
        role: teamUser.role,
      })),
    };
  }
}
