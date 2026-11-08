import {
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { OAuthStateService } from "../session/oauth-state.service";

@Injectable()
export class GoogleGuard extends AuthGuard("google") {
  constructor(private readonly states: OAuthStateService) {
    super({ prompt: "select_account" });
  }
  async getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith("/redirect")) {
      return {
        state: await this.states.begin(
          context.switchToHttp().getResponse<Response>(),
        ),
      };
    }
    // Never let a malformed exchange endpoint fall into Passport's redirect branch.
    if (
      typeof request.query.code !== "string" ||
      !request.query.code ||
      typeof request.query.state !== "string" ||
      !request.query.state
    )
      throw new UnauthorizedException();
    return {};
  }
}
