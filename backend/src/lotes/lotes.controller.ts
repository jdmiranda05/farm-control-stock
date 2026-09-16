import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateLoteEntradaDto } from './dto/create-lote-entrada.dto.js';
import { LotesService } from './lotes.service.js';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard.js';

@Controller('api/lotes')
@UseGuards(SupabaseAuthGuard)
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Get()
  findAll() {
    return this.lotesService.findAll();
  }

  @Post('entrada')
  registrarEntrada(@Body() dto: CreateLoteEntradaDto) {
    return this.lotesService.registrarEntrada(dto);
  }
}
