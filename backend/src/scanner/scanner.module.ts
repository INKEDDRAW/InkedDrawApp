import { Module } from '@nestjs/common';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [SupabaseModule, CollectionsModule],
  controllers: [ScannerController],
  providers: [ScannerService],
  exports: [ScannerService],
})
export class ScannerModule {}
