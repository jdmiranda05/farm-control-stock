import { IsBooleanString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
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

  /** "true" para listar solo los lotes que todavía tienen mercadería. */
  @IsOptional()
  @IsBooleanString({ message: 'soloConStock debe ser "true" o "false"' })
  soloConStock?: string;

  /** Texto libre: N° de lote, nombre o código del producto, proveedor o su RUC. */
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'La búsqueda admite como máximo 60 caracteres' })
  busqueda?: string;
}
