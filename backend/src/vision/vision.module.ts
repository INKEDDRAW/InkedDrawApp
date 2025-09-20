/**
 * Vision Module
 * Google Vision API integration for cigar image recognition and product identification
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { VisionService } from './vision.service';
import { ProductRecognitionService } from './product-recognition.service';
import { VisionController } from './vision.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  providers: [
    VisionService,
    ProductRecognitionService,
  ],
  controllers: [VisionController],
  exports: [
    VisionService,
    ProductRecognitionService,
  ],
})
export class VisionModule {}
