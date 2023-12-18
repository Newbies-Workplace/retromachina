import { Module } from '@nestjs/common';
import { BoardController } from './application/board.controller';
import { BoardService } from './board.service';
import { BoardGateway } from './application/board.gateway';
import { AuthModule } from '../auth/auth.module';
import { AuthAbilityFactory } from '../auth/auth.ability';

@Module({
  imports: [AuthModule],
  providers: [BoardService, BoardGateway, AuthAbilityFactory],
  controllers: [BoardController],
})
export class BoardModule {}
