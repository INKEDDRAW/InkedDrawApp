/**
 * Moderation Module
 * NestJS module for content moderation and safety features
 */

import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ContentAnalysisService } from './content-analysis.service';
import { ImageModerationService } from './image-moderation.service';
import { TextModerationService } from './text-moderation.service';
import { UserReportingService } from './user-reporting.service';
import { ModerationQueueService } from './moderation-queue.service';
import { AutoModerationService } from './auto-moderation.service';
import { DatabaseModule } from '../database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DatabaseModule, AnalyticsModule, RealtimeModule],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    ContentAnalysisService,
    ImageModerationService,
    TextModerationService,
    UserReportingService,
    ModerationQueueService,
    AutoModerationService,
  ],
  exports: [
    ModerationService,
    ContentAnalysisService,
    ImageModerationService,
    TextModerationService,
    UserReportingService,
    ModerationQueueService,
    AutoModerationService,
  ],
})
export class ModerationModule {}
