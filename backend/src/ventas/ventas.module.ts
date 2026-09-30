import { Module } from '@nestjs/common';
import { InventarioModule } from '../inventario/inventario.module';
import { KardexModule } from '../kardex/kardex.module';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

/**
 * Módulo del punto de venta.
 * Importa InventarioModule para usar FefoService (despacho de stock)
 * y KardexModule para dejar constancia de cada salida.
 */
@Module({
  imports: [InventarioModule, KardexModule],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
