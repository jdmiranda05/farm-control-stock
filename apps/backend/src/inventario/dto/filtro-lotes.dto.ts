import { IsBooleanString, IsOptional, IsUUID } from 'class-validator';
import { PaginacionDto } from '../../comun/dto/paginacion.dto';

/**
 * Filtros del listado de lotes (GET /api/inventario/lotes).
 * Hereda `pagina` y `porPagina` de PaginacionDto.
 */
export class FiltroLotesDto extends PaginacionDto {
  @IsOptional()
  @IsUUID('4', { message: 'El producto debe ser un UUID válido' })
  productoId?: string;

  /** "true" para listar únicamente los lotes ya vencidos. */
  @IsOptional()
  @IsBooleanString({ message: 'soloVencidos debe ser "true" o "false"' })
  soloVencidos?: string;
}
