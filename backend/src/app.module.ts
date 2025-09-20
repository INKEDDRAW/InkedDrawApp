import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AgeVerificationModule } from './age-verification/age-verification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SocialModule } from './social/social.module';
import { CatalogModule } from './catalog/catalog.module';
import { AIModule } from './ai/ai.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ModerationModule } from './moderation/moderation.module';
import { PerformanceModule } from './performance/performance.module';
import { VisionModule } from './vision/vision.module';
import { LocationModule } from './location/location.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    AgeVerificationModule,
    AnalyticsModule,
    SocialModule,
    CatalogModule,
    AIModule,
    RealtimeModule,
    ModerationModule,
    PerformanceModule,
    VisionModule,
    LocationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
