import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PokerGateway } from "./application/poker.gateway";
import { PokerDeckController } from "./application/poker-deck.controller";

@Module({
  imports: [AuthModule],
  controllers: [PokerDeckController],
  providers: [PokerGateway],
})
export class PokerModule {}
