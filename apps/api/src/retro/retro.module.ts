import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { AuthModule } from "../auth/auth.module";
import { RetroController } from "./application/retro.controller";
import { RetroGateway } from "./application/retro.gateway";
import { RetroSchedules } from "./application/retro.schedules";
import { RetroService } from "./domain/retro.service";
import { RetroRoomPersistence } from "./domain/retro-room.persistence";

@Module({
  imports: [AuthModule, ScheduleModule.forRoot()],
  providers: [
    RetroService,
    RetroGateway,
    RetroSchedules,
    RetroRoomPersistence,
    AuthAbilityFactory,
  ],
  controllers: [RetroController],
  exports: [RetroGateway],
})
export class RetroModule {}
