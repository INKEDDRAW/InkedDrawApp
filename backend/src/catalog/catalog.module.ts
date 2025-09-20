/**
 * Catalog Module
 * NestJS module for product catalog and reviews
 */

import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ReviewsController } from './reviews.controller';
import { CatalogService } from './catalog.service';
import { ProductsService } from './products.service';
import { ReviewsService } from './reviews.service';
import { SearchService } from './search.service';
import { DatabaseModule } from '../database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [DatabaseModule, AnalyticsModule],
  controllers: [ProductsController, ReviewsController],
  providers: [CatalogService, ProductsService, ReviewsService, SearchService],
  exports: [CatalogService, ProductsService, ReviewsService, SearchService],
})
export class CatalogModule {}
