import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * DTO para registrar una ENTRADA MANUAL de mercadería
 * (POST /api/inventario/entradas).
 *
 * Regla del negocio: las entradas al almacén SIEMPRE se registran a mano y
 * SIEMPRE en CAJAS, porque así llega la mercadería del proveedor. Las
 * salidas, en cambio, son automáticas (las genera el punto de venta).
 *
 * Si el número de lote ya existe para ese producto, se suman las cajas
 * al lote existente; si no existe, se crea uno nuevo.
 */
export class RegistrarEntradaDto {
  @IsUUID('4', { message: 'El producto debe ser un UUID válido' })
  productoId: string;

  /** Proveedor que entregó la mercadería (permite rastrear su origen). */
  @IsOptional()
  @IsUUID('4', { message: 'El proveedor debe ser un UUID válido' })
  proveedorId?: string;

  @IsString({ message: 'El número de lote debe ser un texto' })
  @IsNotEmpty({ message: 'El número de lote es obligatorio' })
  numeroLote: string;

  /** Formato ISO: AAAA-MM-DD (ej. "2027-08-31"). */
  @IsDateString({}, { message: 'La fecha de vencimiento debe tener formato AAAA-MM-DD' })
  fechaVencimiento: string;

  /** Cantidad de CAJAS recibidas. */
  @IsInt({ message: 'La cantidad de cajas debe ser un número entero' })
  @Min(1, { message: 'Debe ingresar al menos 1 caja' })
  cantidadCajas: number;

  /** Costo de compra de UNA caja: base del cálculo de merma en soles. */
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El costo por caja admite máximo 2 decimales' },
  )
  @Min(0, { message: 'El costo por caja no puede ser negativo' })
  costoCaja: number;
}
