import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { GoogleUser } from "./google/GoogleUser";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async googleAuth(user: GoogleUser) {
    const nick = `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;
    let queryUser = await this.prismaService.user.findFirst({
      where: {
        google_id: user.id,
      },
    });

    if (!queryUser) {
      queryUser = await this.prismaService.user.create({
        data: {
          nick,
          email: user.email,
          avatar_link: user.picture,
          google_id: user.id,
        },
      });

      const invites = await this.prismaService.invite.findMany({
        where: {
          email: user.email,
        },
      });

      for (const invite of invites) {
        await this.prismaService.teamUsers.create({
          data: {
            team_id: invite.team_id,
            user_id: queryUser.id,
            role: invite.role,
          },
        });

        await this.prismaService.invite.delete({
          where: {
            id: invite.id,
          },
        });
      }
    } else {
      queryUser = await this.prismaService.user.update({
        where: {
          id: queryUser.id,
        },
        data: {
          nick,
          avatar_link: user.picture,
        },
      });
    }

    return this.jwtService.sign(
      {
        user: {
          id: queryUser.id,
          nick: queryUser.nick,
          email: queryUser.email,
          google_id: user.id,
        },
      },
      { secret: process.env.JWT_SECRET },
    );
  }
}
