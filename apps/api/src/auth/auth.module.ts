import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google/google.strategy';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { AuthAbilityFactory } from './auth.ability';

@Module({
  providers: [AuthService, GoogleStrategy, JwtService, AuthAbilityFactory],
  controllers: [AuthController],
  exports: [JwtService, AuthAbilityFactory]
})
export class AuthModule {}
