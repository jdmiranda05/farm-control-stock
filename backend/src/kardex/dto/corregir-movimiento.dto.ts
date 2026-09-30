import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO para CORREGIR un movimiento del historial (PATCH /api/kardex/:id).
 * Operación reservada al rol ADMIN: sirve para enmendar errores
 * administrativos (una cantidad mal digitada, un motivo equivocado).
 *
 * El movimiento corregido queda marcado con `editado = true` junto con
 * quién y cuándo lo modificó, para no perder la trazabilidad.
 */
export class CorregirMovimientoDto {
  /** Cantidad corregida, en la MISMA unidad que tenía el movimiento. */
  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad?: number;

  /** Valorización corregida en soles. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El valor admite máximo 2 decimales' })
  @Min(0, { message: 'El valor no puede ser negativo' })
  valorSoles?: number;

  /** Explicación de la corrección (queda registrada en el historial). */
  @IsString({ message: 'El motivo debe ser un texto' })
  @IsNotEmpty({ message: 'Debe indicar el motivo de la corrección' })
  motivo: string;
}
