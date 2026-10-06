import {
  type ArgumentsHost,
  Catch,
  Logger,
  type WsExceptionFilter,
} from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import type { Socket } from "socket.io";

@Catch()
export class RetroWsExceptionFilter implements WsExceptionFilter {
  private readonly logger = new Logger(RetroWsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    // Do not log payloads, token headers, or raw database/validation messages.
    const type =
      exception instanceof WsException
        ? "validation/access"
        : "unexpected error";
    this.logger.warn(`Retrospective command rejected (${type})`);
    const client = host.switchToWs().getClient<Socket>();
    client.emit("exception", {
      status: "error",
      message:
        exception instanceof WsException
          ? "Command rejected"
          : "Command failed",
    });
  }
}
