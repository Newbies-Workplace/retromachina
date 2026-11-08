import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";
import type { Socket } from "socket.io";
import { TeamSocketAccessService } from "./team-socket-access.service";

@Injectable()
export class TeamSocketGuard implements CanActivate {
  constructor(private readonly access: TeamSocketAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.access.authorize(context.switchToWs().getClient<Socket>());
    return true;
  }
}
