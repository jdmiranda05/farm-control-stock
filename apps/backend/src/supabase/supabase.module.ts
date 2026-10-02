import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Módulo global: expone el cliente de Supabase a toda la aplicación
 * sin necesidad de importarlo módulo por módulo.
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
