import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { PaginacionDto } from '../../comun/dto/paginacion.dto';

/** Máximo de productos por página en la pantalla "Productos y Categorías". */
export const MAXIMO_PRODUCTOS_POR_PAGINA = 30;

/**
 * Filtros del catálogo paginado (GET /api/productos/paginado).
 * ?pagina=2&porPagina=30&busqueda=para&categoriaId=<uuid>
 */
export class FiltroProductosDto extends PaginacionDto {
  /** Texto libre: busca en nombre, código, laboratorio y categoría. */
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'La búsqueda admite como máximo 60 caracteres' })
  busqueda?: string;

  @IsOptional()
  @IsUUID('4', { message: 'La categoría debe ser un UUID válido' })
  categoriaId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero' })
  @Min(1, { message: 'Debe pedir al menos 1 producto' })
  @Max(MAXIMO_PRODUCTOS_POR_PAGINA, {
    message: `Se muestran como máximo ${MAXIMO_PRODUCTOS_POR_PAGINA} productos por página`,
  })
  porPagina?: number = MAXIMO_PRODUCTOS_POR_PAGINA;
}
