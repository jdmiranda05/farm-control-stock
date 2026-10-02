import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { UnidadEmpaque } from '@botica/comun';

/** Una línea del carrito del punto de venta. */
export class LineaVentaDto {
  @IsUUID('4', { message: 'El producto debe ser un UUID válido' })
  productoId: string;

  /** Si se vende la caja completa o blísters sueltos. */
  @IsEnum(UnidadEmpaque, { message: 'La modalidad debe ser CAJA o BLISTER' })
  modalidad: UnidadEmpaque;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;
}

/**
 * DTO de la venta completa (POST /api/ventas).
 *
 * `@ValidateNested({ each: true })` junto con `@Type(() => LineaVentaDto)`
 * hace que class-validator revise TAMBIÉN cada línea del arreglo: sin el
 * decorador @Type, las líneas llegarían como objetos planos y sus reglas
 * no se aplicarían.
 */
export class RegistrarVentaDto {
  @IsArray({ message: 'Las líneas de venta deben enviarse en un arreglo' })
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => LineaVentaDto)
  lineas: LineaVentaDto[];
}
