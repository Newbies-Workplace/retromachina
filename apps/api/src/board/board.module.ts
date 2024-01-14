import { Module } from "@nestjs/common";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { AuthModule } from "../auth/auth.module";
import { BoardController } from "./application/board.controller";
import { BoardGateway } from "./application/board.gateway";
import { BoardService } from "./board.service";

@Module({
	imports: [AuthModule],
	providers: [BoardService, BoardGateway, AuthAbilityFactory],
	controllers: [BoardController],
})
export class BoardModule {}
