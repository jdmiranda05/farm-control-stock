import { Module } from '@nestjs/common';
import { ProductosController } from './productos.controller';
import { CategoriasController } from './categorias.controller';
import { ProductosService } from './productos.service';

/** Módulo del catálogo: productos y sus categorías. */
@Module({
  controllers: [ProductosController, CategoriasController],
  providers: [ProductosService],
  exports: [ProductosService],
})
export class ProductosModule {}
