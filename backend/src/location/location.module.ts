/**
 * Location Module
 * Location-based services for finding smoke shops and retailers
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { LocationService } from './location.service';
import { SmokeShopService } from './smoke-shop.service';
import { LocationController } from './location.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  providers: [
    LocationService,
    SmokeShopService,
  ],
  controllers: [LocationController],
  exports: [
    LocationService,
    SmokeShopService,
  ],
})
export class LocationModule {}
