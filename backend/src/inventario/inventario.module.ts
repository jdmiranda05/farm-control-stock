import { Module } from '@nestjs/common';
import { KardexModule } from '../kardex/kardex.module';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { FefoService } from './fefo.service';

/**
 * Módulo del almacén: lotes, entradas manuales y mermas.
 * Exporta FefoService para que el módulo de ventas pueda despachar
 * mercadería con la estrategia "primero en vencer, primero en salir".
 */
@Module({
  imports: [KardexModule],
  controllers: [InventarioController],
  providers: [InventarioService, FefoService],
  exports: [InventarioService, FefoService],
})
export class InventarioModule {}
