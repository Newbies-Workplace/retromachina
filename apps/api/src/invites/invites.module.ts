import { Module } from "@nestjs/common";
import { JwtStrategy } from "src/auth/jwt/jwt.strategy";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { InvitesController } from "./invites.controller";

@Module({
  controllers: [InvitesController],
  providers: [JwtStrategy, AuthAbilityFactory],
})
export class InvitesModule {}
