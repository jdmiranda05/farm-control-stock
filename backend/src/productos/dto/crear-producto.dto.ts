import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * DTO de creación de producto (POST /api/productos).
 * class-validator valida cada campo ANTES de llegar al servicio;
 * si algo falla, NestJS responde 400 con los mensajes en español.
 */
export class CrearProductoDto {
  /** Código interno o de barras (opcional, único dentro de la botica). */
  @IsOptional()
  @IsString({ message: 'El código debe ser un texto' })
  codigo?: string;

  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsUUID('4', { message: 'La categoría debe ser un UUID válido' })
  categoriaId?: string;

  /** Ej. "Caja x 10 blísters de 10 tabletas". */
  @IsOptional()
  @IsString()
  presentacion?: string;

  @IsOptional()
  @IsString()
  laboratorio?: string;

  /**
   * Cuántos blísters trae una caja. Es la base de toda la conversión:
   * 1 caja de Amoxicilina = 20 blísters.
   * Los productos que se venden por unidad (frascos, geles) llevan 1.
   */
  @IsInt({ message: 'Las unidades por caja deben ser un número entero' })
  @Min(1, { message: 'Una caja debe contener al menos 1 unidad' })
  unidadesPorCaja: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio por caja debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El precio por caja no puede ser negativo' })
  precioCaja: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio por blíster debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El precio por blíster no puede ser negativo' })
  precioBlister: number;

  /** Umbral de la alerta de stock, expresado en BLÍSTERS. */
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stockMinimo: number;

  @IsOptional()
  @IsBoolean({ message: 'requiereReceta debe ser verdadero o falso' })
  requiereReceta?: boolean;
}
