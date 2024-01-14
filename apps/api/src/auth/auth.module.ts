import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { AuthAbilityFactory } from "./auth.ability";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./google/google.strategy";

@Module({
	providers: [AuthService, GoogleStrategy, JwtService, AuthAbilityFactory],
	controllers: [AuthController],
	exports: [JwtService, AuthAbilityFactory],
})
export class AuthModule {}
