import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RetroGateway } from './retro.gateway';

@Injectable()
export class RetroSchedules {
  private readonly logger = new Logger(RetroSchedules.name);

  constructor(
    private retroGateway: RetroGateway,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    const closedNumber = await this.retroGateway.closeStaleRooms()

    if (closedNumber > 0) {
      this.logger.log(`Closed stale rooms: ${closedNumber}`)
    }
  }
}
