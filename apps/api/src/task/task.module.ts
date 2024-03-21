import { Module } from "@nestjs/common";
import { JwtStrategy } from "src/auth/jwt/jwt.strategy";
import { AuthAbilityFactory } from "../auth/auth.ability";
import { TaskController } from "./application/task.controller";

@Module({
  providers: [JwtStrategy, AuthAbilityFactory],
  controllers: [TaskController],
})
export class TaskModule {}
