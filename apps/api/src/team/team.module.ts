import { Module } from "@nestjs/common";
import { JwtStrategy } from "src/auth/jwt/jwt.strategy";
import { UserModule } from "src/user/user.module";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { TeamController } from "./application/team.controller";
import { TeamService } from "./team.service";

@Module({
  imports: [UserModule],
  controllers: [TeamController],
  providers: [TeamService, JwtStrategy, AuthAbilityFactory],
  exports: [AuthAbilityFactory],
})
export class TeamModule {}
