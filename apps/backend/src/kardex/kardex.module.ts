import { Module } from '@nestjs/common';
import { KardexController } from './kardex.controller';
import { KardexService } from './kardex.service';

/**
 * Módulo del Kardex.
 * Exporta KardexService para que Inventario y Ventas registren en él
 * sus movimientos sin escribir en la tabla directamente.
 */
@Module({
  controllers: [KardexController],
  providers: [KardexService],
  exports: [KardexService],
})
export class KardexModule {}
