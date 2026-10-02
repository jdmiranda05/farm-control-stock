import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TipoMovimientoKardex } from '@botica/comun';
import { PaginacionDto } from '../../comun/dto/paginacion.dto';

/**
 * Filtros del Kardex (GET /api/kardex).
 * Hereda `pagina` y `porPagina` de PaginacionDto.
 *
 * Ejemplo: /api/kardex?tipo=SALIDA_VENTA&desde=2026-09-01&pagina=2
 */
export class FiltroKardexDto extends PaginacionDto {
  @IsOptional()
  @IsEnum(TipoMovimientoKardex, {
    message:
      'El tipo debe ser ENTRADA_MANUAL, SALIDA_VENTA, SALIDA_MERMA o AJUSTE_ADMIN',
  })
  tipo?: TipoMovimientoKardex;

  @IsOptional()
  @IsUUID('4', { message: 'El producto debe ser un UUID válido' })
  productoId?: string;

  /** Fecha inicial del rango, formato AAAA-MM-DD (incluida). */
  @IsOptional()
  @IsDateString({}, { message: 'La fecha "desde" debe tener formato AAAA-MM-DD' })
  desde?: string;

  /** Fecha final del rango, formato AAAA-MM-DD (incluida). */
  @IsOptional()
  @IsDateString({}, { message: 'La fecha "hasta" debe tener formato AAAA-MM-DD' })
  hasta?: string;
}
