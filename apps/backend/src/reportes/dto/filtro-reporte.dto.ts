import { IsDateString, IsOptional } from 'class-validator';
import { PaginacionDto } from '../../comun/dto/paginacion.dto';

/**
 * Filtros del reporte de entradas y salidas (GET /api/reportes/diario).
 *
 * Si no se envía ninguna fecha, el servicio asume el DÍA ACTUAL.
 * Para un rango se envían ambas: ?desde=2026-09-01&hasta=2026-09-14
 */
export class FiltroReporteDto extends PaginacionDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha "desde" debe tener formato AAAA-MM-DD' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha "hasta" debe tener formato AAAA-MM-DD' })
  hasta?: string;
}
