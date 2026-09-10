import { Injectable, type MessageEvent } from "@nestjs/common";
import { finalize, type Observable, Subject } from "rxjs";
import type { RetroStartedEvent } from "shared/model/notification/notification.events";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationService {
  private readonly subscribers = new Map<string, Set<Subject<MessageEvent>>>();

  constructor(private readonly prismaService: PrismaService) {}

  subscribe(userId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    const userSubscribers = this.subscribers.get(userId) ?? new Set();

    userSubscribers.add(subject);
    this.subscribers.set(userId, userSubscribers);

    return subject.pipe(finalize(() => this.removeSubscriber(userId, subject)));
  }

  async notifyTeamRetroStarted(
    teamId: string,
    initiatorId: string,
    event: RetroStartedEvent,
  ) {
    const recipients = await this.prismaService.teamUsers.findMany({
      where: {
        team_id: teamId,
        user_id: { not: initiatorId },
      },
      select: { user_id: true },
    });

    this.publishRetroStarted(
      recipients.map(({ user_id }) => user_id),
      event,
    );
  }

  private publishRetroStarted(userIds: string[], event: RetroStartedEvent) {
    for (const userId of userIds) {
      for (const subscriber of this.subscribers.get(userId) ?? []) {
        subscriber.next({ data: event });
      }
    }
  }

  private removeSubscriber(userId: string, subject: Subject<MessageEvent>) {
    const userSubscribers = this.subscribers.get(userId);
    if (!userSubscribers) return;

    userSubscribers.delete(subject);
    if (userSubscribers.size === 0) this.subscribers.delete(userId);
  }
}
