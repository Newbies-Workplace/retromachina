import { Module } from '@nestjs/common';
import { TaskController } from './application/task.controller';
import { JwtStrategy } from 'src/auth/jwt/jwt.strategy';
import { AuthAbilityFactory } from '../auth/auth.ability';

@Module({
  providers: [JwtStrategy, AuthAbilityFactory],
  controllers: [TaskController],
})
export class TaskModule {}
