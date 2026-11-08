import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { BoardModule } from "./board/board.module";
import { InvitesModule } from "./invites/invites.module";
import { PokerModule } from "./poker/poker.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RetroModule } from "./retro/retro.module";
import {
  DEFAULT_THROTTLE,
  HttpThrottlerGuard,
} from "./security/http-throttler.guard";
import { SecurityModule } from "./security/security.module";
import { TaskModule } from "./task/task.module";
import { TeamModule } from "./team/team.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [DEFAULT_THROTTLE],
      // End-to-end runs send every request from one address; see
      // apps/web/playwright.config.ts. Never set this in production.
      skipIf: () => process.env.RATE_LIMIT_DISABLED === "true",
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    AuthModule,
    PrismaModule,
    SecurityModule,
    UserModule,
    TeamModule,
    TaskModule,
    BoardModule,
    RetroModule,
    InvitesModule,
    PokerModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: HttpThrottlerGuard }],
})
export class AppModule {}
