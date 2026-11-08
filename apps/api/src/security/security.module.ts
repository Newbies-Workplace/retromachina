import { Global, Module } from "@nestjs/common";
import { AuthSecurityModule } from "../auth/session/auth-security.module";
import { PrismaModule } from "../prisma/prisma.module";
import { TeamSocketGuard } from "./team-socket.guard";
import { TeamSocketAccessService } from "./team-socket-access.service";

@Global()
@Module({
  imports: [PrismaModule, AuthSecurityModule],
  providers: [TeamSocketAccessService, TeamSocketGuard],
  exports: [TeamSocketAccessService, TeamSocketGuard],
})
export class SecurityModule {}
