import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PokerGateway } from "./application/poker.gateway";

@Module({
  imports: [AuthModule],
  providers: [PokerGateway],
})
export class PokerModule {}
