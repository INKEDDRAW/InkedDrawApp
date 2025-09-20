/**
 * Realtime Module
 * NestJS module for real-time features and WebSocket connections
 */

import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { NotificationService } from './notification.service';
import { LiveFeedService } from './live-feed.service';
import { PresenceService } from './presence.service';
import { ChatService } from './chat.service';
import { RealtimeController } from './realtime.controller';
import { DatabaseModule } from '../database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [DatabaseModule, AnalyticsModule, SocialModule],
  controllers: [RealtimeController],
  providers: [
    RealtimeGateway,
    NotificationService,
    LiveFeedService,
    PresenceService,
    ChatService,
  ],
  exports: [
    RealtimeGateway,
    NotificationService,
    LiveFeedService,
    PresenceService,
    ChatService,
  ],
})
export class RealtimeModule {}
