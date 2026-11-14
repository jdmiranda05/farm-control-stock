import { Type } from 'class-transformer';
import { IsBooleanString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EstadoAlerta, TipoAlerta } from '@botica/comun';
import { PaginacionDto } from '../../comun/dto/paginacion.dto';

/** Máximo de alertas por página que muestra la pantalla de Alertas. */
export const MAXIMO_ALERTAS_POR_PAGINA = 30;

/**
 * Filtros del listado de alertas (GET /api/alertas).
 * ?estado=ACTIVA&tipo=VENCIDO&recalcular=true&pagina=2&porPagina=30
 */
export class FiltroAlertasDto extends PaginacionDto {
  @IsOptional()
  @IsEnum(EstadoAlerta, { message: 'El estado debe ser ACTIVA o RESUELTA' })
  estado?: EstadoAlerta;

  @IsOptional()
  @IsEnum(TipoAlerta, { message: 'Tipo de alerta no válido' })
  tipo?: TipoAlerta;

  /** "true" para reconciliar el motor de alertas antes de listar. */
  @IsOptional()
  @IsBooleanString({ message: 'recalcular debe ser "true" o "false"' })
  recalcular?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero' })
  @Min(1, { message: 'Debe pedir al menos 1 alerta' })
  @Max(MAXIMO_ALERTAS_POR_PAGINA, {
    message: `Se muestran como máximo ${MAXIMO_ALERTAS_POR_PAGINA} alertas por página`,
  })
  porPagina?: number = MAXIMO_ALERTAS_POR_PAGINA; // por defecto 30 (no 10 como el resto)
}
