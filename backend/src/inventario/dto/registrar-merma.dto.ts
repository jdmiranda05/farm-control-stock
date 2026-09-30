import { IsEnum, IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';
import { UnidadEmpaque } from '@botica/comun';

/**
 * DTO para declarar una MERMA (POST /api/inventario/mermas).
 *
 * La merma se registra sobre un LOTE concreto (no por FEFO), porque el
 * almacenero retira físicamente una mercadería determinada: la del lote
 * vencido o dañado que tiene en la mano.
 *
 * El sistema valoriza la pérdida en soles automáticamente:
 *   merma = cantidad_en_blisters * (costo_caja / unidades_por_caja)
 */
export class RegistrarMermaDto {
  @IsUUID('4', { message: 'El lote debe ser un UUID válido' })
  loteId: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;

  @IsEnum(UnidadEmpaque, { message: 'La unidad debe ser CAJA o BLISTER' })
  unidad: UnidadEmpaque;

  /** Ej. "Vencido", "Frasco roto en almacén". */
  @IsString({ message: 'El motivo debe ser un texto' })
  @IsNotEmpty({ message: 'Debe indicar el motivo de la merma' })
  motivo: string;
}
