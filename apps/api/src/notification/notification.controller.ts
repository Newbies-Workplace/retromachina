import { Controller, type MessageEvent, Sse, UseGuards } from "@nestjs/common";
import {
  catchError,
  concatMap,
  interval,
  map,
  merge,
  type Observable,
  of,
  takeUntil,
  timer,
} from "rxjs";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { AccessTokenService } from "../auth/session/access-token.service";
import { NotificationService } from "./notification.service";

@Controller("notifications")
export class NotificationController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly access: AccessTokenService,
  ) {}

  @Sse("events")
  @UseGuards(JwtGuard)
  events(@User() user: JWTUser): Observable<MessageEvent> {
    const heartbeat = interval(15_000).pipe(
      map(() => ({ type: "heartbeat", data: { timestamp: Date.now() } })),
    );

    if (!user.auth) return of();
    const claims = user.auth;
    return merge(this.notifications.subscribe(user.id), heartbeat).pipe(
      concatMap(async (event) => {
        await this.access.assertSession(claims);
        return event;
      }),
      takeUntil(timer(Math.max(0, claims.exp * 1000 - Date.now()))),
      catchError(() => of()),
    );
  }
}
