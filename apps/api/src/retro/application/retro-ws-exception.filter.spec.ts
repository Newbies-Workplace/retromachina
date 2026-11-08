import { type ArgumentsHost, Logger } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { RetroWsExceptionFilter } from "./retro-ws-exception.filter";

describe("RetroWsExceptionFilter", () => {
  it.each([
    new WsException("secret payload"),
    new Error("mysql://private-secret"),
  ])("returns a safe error and never logs raw payloads or credentials", (exception) => {
    const emit = jest.fn();
    const warn = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => {});
    const host = {
      switchToWs: () => ({ getClient: () => ({ emit }) }),
    } as unknown as ArgumentsHost;
    new RetroWsExceptionFilter().catch(exception, host);
    expect(emit).toHaveBeenCalledWith("exception", {
      status: "error",
      message:
        exception instanceof WsException
          ? "Command rejected"
          : "Command failed",
    });
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/secret|mysql/);
    warn.mockRestore();
  });
});
