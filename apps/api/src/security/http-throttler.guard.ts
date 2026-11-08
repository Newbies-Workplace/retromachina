import { type ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/** Default per-IP budget for every HTTP route. */
export const DEFAULT_THROTTLE = { ttl: 60_000, limit: 300 };
/** Stricter budget for sign-in, token refresh and invite-key lookups. */
export const SENSITIVE_THROTTLE = { default: { ttl: 60_000, limit: 20 } };

/**
 * Rate limits HTTP requests only. Socket.IO gateways authorize every command
 * separately and have no HTTP request/response to attach limits to.
 */
@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== "http") return true;
    return super.canActivate(context);
  }
}
