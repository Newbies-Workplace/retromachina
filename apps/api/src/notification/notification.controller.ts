import { Controller, type MessageEvent, Sse, UseGuards } from "@nestjs/common";
import { interval, map, merge, type Observable } from "rxjs";
import { JWTUser } from "src/auth/jwt/JWTUser";
import { JwtGuard } from "src/auth/jwt/jwt.guard";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { NotificationService } from "./notification.service";

@Controller("notifications")
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Sse("events")
  @UseGuards(JwtGuard)
  events(@User() user: JWTUser): Observable<MessageEvent> {
    const heartbeat = interval(15_000).pipe(
      map(() => ({ type: "heartbeat", data: { timestamp: Date.now() } })),
    );

    return merge(this.notifications.subscribe(user.id), heartbeat);
  }
}
