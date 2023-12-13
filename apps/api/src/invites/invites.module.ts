import { Module } from '@nestjs/common';
import { JwtStrategy } from 'src/auth/jwt/jwt.strategy';
import { InvitesController } from './invites.controller';
import { AuthAbilityFactory } from '../auth/auth.ability';

@Module({
  controllers: [InvitesController],
  providers: [JwtStrategy, AuthAbilityFactory],
})
export class InvitesModule {}
