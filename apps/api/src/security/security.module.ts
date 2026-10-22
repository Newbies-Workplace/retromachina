import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TeamSocketGuard } from "./team-socket.guard";
import { TeamSocketAccessService } from "./team-socket-access.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TeamSocketAccessService, TeamSocketGuard],
  exports: [TeamSocketAccessService, TeamSocketGuard],
})
export class SecurityModule {}
