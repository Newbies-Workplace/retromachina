import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt/dist";
import { AuthModule } from "./auth/auth.module";
import { BoardModule } from "./board/board.module";
import { InvitesModule } from "./invites/invites.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RetroModule } from "./retro/retro.module";
import { TaskModule } from "./task/task.module";
import { TeamModule } from "./team/team.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    AuthModule,
    PrismaModule,
    UserModule,
    TeamModule,
    TaskModule,
    BoardModule,
    RetroModule,
    InvitesModule,
  ],
})
export class AppModule {}
