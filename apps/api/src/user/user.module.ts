import { Module } from "@nestjs/common";
import { JwtStrategy } from "src/auth/jwt/jwt.strategy";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { UserController } from "./application/user.controller";

@Module({
  controllers: [UserController],
  providers: [JwtStrategy, AuthAbilityFactory],
})
export class UserModule {}
