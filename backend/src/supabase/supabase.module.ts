import { Global, Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseAuthGuard } from './supabase-auth.guard.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (config: ConfigService) => {
        return createClient(
          config.getOrThrow<string>('supabase.url'),
          config.getOrThrow<string>('supabase.serviceRoleKey'),
        );
      },
      inject: [ConfigService],
    },
    SupabaseAuthGuard,
  ],
  exports: ['SUPABASE_CLIENT', SupabaseAuthGuard],
})
export class SupabaseModule {}