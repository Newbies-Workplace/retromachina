import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { AuthAbilityFactory } from "./auth.ability";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleGuard } from "./google/google.guard";
import { GoogleStrategy } from "./google/google.strategy";
import { AuthSecurityModule } from "./session/auth-security.module";
import { SessionController } from "./session/session.controller";

@Module({
  imports: [AuthSecurityModule],
  providers: [
    GoogleGuard,
    AuthService,
    GoogleStrategy,
    JwtService,
    AuthAbilityFactory,
  ],
  controllers: [AuthController, SessionController],
  exports: [JwtService, AuthAbilityFactory],
})
export class AuthModule {}
