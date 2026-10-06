import { Global, Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaModule } from "../../prisma/prisma.module";
import { AccessTokenService } from "./access-token.service";
import { AuthSessionService } from "./auth-session.service";
import { OAuthStateService } from "./oauth-state.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    JwtService,
    AccessTokenService,
    AuthSessionService,
    OAuthStateService,
  ],
  exports: [AccessTokenService, AuthSessionService, OAuthStateService],
})
export class AuthSecurityModule {}
