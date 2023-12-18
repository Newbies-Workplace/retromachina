import { Module } from "@nestjs/common";
import { JwtStrategy } from "src/auth/jwt/jwt.strategy";
import { UserModule } from "src/user/user.module";
import { TeamController } from "./application/team.controller";
import { TeamService } from "./team.service";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { TeamConverter } from "./application/team.converter";

@Module({
  imports: [UserModule],
  controllers: [TeamController],
  providers: [TeamService, JwtStrategy, AuthAbilityFactory, TeamConverter],
  exports: [AuthAbilityFactory, TeamConverter],
})
export class TeamModule {}
