import { Module } from '@nestjs/common';
import { BoticasController } from './boticas.controller';
import { BoticasService } from './boticas.service';

/** Módulo del inquilino (tenant): consulta y configuración de la botica. */
@Module({
  controllers: [BoticasController],
  providers: [BoticasService],
  exports: [BoticasService],
})
export class BoticasModule {}
