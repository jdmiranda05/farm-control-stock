import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { RespuestaPaginada } from '@botica/comun';

/**
 * DTO base de paginación del lado del SERVIDOR.
 * Lo heredan los filtros del Kardex, los lotes y el reporte diario.
 *
 * Llega por query string: ?pagina=2&porPagina=20
 * `@Type(() => Number)` convierte el texto de la URL en número antes de validar.
 */
export class PaginacionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero' })
  @Min(1, { message: 'Debe pedir al menos 1 registro' })
  @Max(100, { message: 'El máximo es 100 registros por página' })
  porPagina?: number = 10;
}

/**
 * Traduce la página solicitada al rango que entiende PostgREST/Supabase.
 * Supabase usa `.range(desde, hasta)` con índices que empiezan en 0 y
 * ambos extremos incluidos: la página 2 de 10 en 10 es range(10, 19).
 */
export function calcularRango(dto: PaginacionDto): {
  pagina: number;
  porPagina: number;
  desde: number;
  hasta: number;
} {
  const pagina = dto.pagina && dto.pagina > 0 ? dto.pagina : 1;
  const porPagina = dto.porPagina && dto.porPagina > 0 ? dto.porPagina : 10;
  const desde = (pagina - 1) * porPagina;
  return { pagina, porPagina, desde, hasta: desde + porPagina - 1 };
}

/** Arma la respuesta paginada estándar que consume el frontend. */
export function armarRespuestaPaginada<T>(
  datos: T[],
  total: number,
  pagina: number,
  porPagina: number,
): RespuestaPaginada<T> {
  return {
    datos,
    pagina,
    porPagina,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}
