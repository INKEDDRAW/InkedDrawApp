/**
 * Performance Module
 * Comprehensive performance monitoring and optimization
 */

import { Module } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CacheService } from './cache.service';
import { MetricsService } from './metrics.service';
import { OptimizationService } from './optimization.service';
import { PerformanceController } from './performance.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    PerformanceService,
    CacheService,
    MetricsService,
    OptimizationService,
  ],
  controllers: [PerformanceController],
  exports: [
    PerformanceService,
    CacheService,
    MetricsService,
    OptimizationService,
  ],
})
export class PerformanceModule {}
