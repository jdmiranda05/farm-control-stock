import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { LotesModule } from './lotes/lotes.module.js';
import configuration from './config/configuration.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    SupabaseModule,
    CategoriasModule,
    LotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}