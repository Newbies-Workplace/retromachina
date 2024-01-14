import { Module } from "@nestjs/common";
import { JwtStrategy } from "src/auth/jwt/jwt.strategy";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { TeamConverter } from "../team/application/team.converter";
import { UserController } from "./application/user.controller";

@Module({
	controllers: [UserController],
	providers: [JwtStrategy, AuthAbilityFactory, TeamConverter],
})
export class UserModule {}
