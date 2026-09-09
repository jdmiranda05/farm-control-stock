import { Module } from '@nestjs/common';
import { CategoriasService } from './categorias.service.js';
import { CategoriasController } from './categorias.controller.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [CategoriasController],
  providers: [CategoriasService],
  exports: [CategoriasService],
})
export class CategoriasModule {}
