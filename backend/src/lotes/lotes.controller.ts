import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateLoteEntradaDto } from './dto/create-lote-entrada.dto.js';
import { LotesService } from './lotes.service.js';

@Controller('api/lotes')
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
