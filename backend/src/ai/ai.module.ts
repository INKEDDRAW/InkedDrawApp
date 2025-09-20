/**
 * AI Module
 * NestJS module for AI-powered features and recommendations
 */

import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { VectorService } from './vector.service';
import { CollaborativeFilteringService } from './collaborative-filtering.service';
import { PersonalizationService } from './personalization.service';
import { RecommendationController } from './recommendation.controller';
import { DatabaseModule } from '../database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [DatabaseModule, AnalyticsModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    VectorService,
    CollaborativeFilteringService,
    PersonalizationService,
  ],
  exports: [
    RecommendationService,
    VectorService,
    CollaborativeFilteringService,
    PersonalizationService,
  ],
})
export class AIModule {}
