import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScannerModule } from './scanner/scanner.module';
import { CollectionsModule } from './collections/collections.module';
import { SocialModule } from './social/social.module';
import { SupabaseModule } from './supabase/supabase.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ScannerModule,
    CollectionsModule,
    SocialModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
