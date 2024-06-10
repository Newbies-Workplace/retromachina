import { Module } from "@nestjs/common";
import { JwtStrategy } from "src/auth/jwt/jwt.strategy";
import { UserModule } from "src/user/user.module";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { RetroModule } from "../retro/retro.module";
import { TeamController } from "./application/team.controller";
import { TeamService } from "./team.service";

@Module({
  imports: [UserModule, RetroModule],
  controllers: [TeamController],
  providers: [TeamService, JwtStrategy, AuthAbilityFactory],
  exports: [AuthAbilityFactory],
})
export class TeamModule {}
