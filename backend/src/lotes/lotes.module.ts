import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { LotesController } from './lotes.controller.js';
import { LotesService } from './lotes.service.js';

@Module({
  imports: [SupabaseModule],
  controllers: [LotesController],
  providers: [LotesService],
})
export class LotesModule {}
