/**
 * Analytics Module
 * Handles event tracking and user analytics
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PostHogService } from './posthog.service';
import { AnalyticsMiddleware } from './middleware/analytics.middleware';

@Module({
  imports: [ConfigModule],
  providers: [
    AnalyticsService,
    PostHogService,
    AnalyticsMiddleware,
  ],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, PostHogService],
})
export class AnalyticsModule {}
