/**
 * Age Verification Module
 * Handles identity verification and age compliance using Veriff
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgeVerificationController } from './age-verification.controller';
import { AgeVerificationService } from './age-verification.service';
import { VeriffService } from './veriff.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [AgeVerificationController],
  providers: [AgeVerificationService, VeriffService],
  exports: [AgeVerificationService],
})
export class AgeVerificationModule {}
