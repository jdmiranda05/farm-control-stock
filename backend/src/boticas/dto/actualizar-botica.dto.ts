import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/**
 * DTO para actualizar la configuración de la botica (pantalla Configuración).
 * Todos los campos son opcionales: solo se actualiza lo que llega.
 */
export class ActualizarBoticaDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'El RUC debe tener exactamente 11 dígitos' })
  ruc?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  /** Parámetro del sistema de alertas: días de anticipación al vencimiento. */
  @IsOptional()
  @IsInt({ message: 'Los días de alerta deben ser un número entero' })
  @Min(1, { message: 'Los días de alerta deben ser al menos 1' })
  @Max(365, { message: 'Los días de alerta no pueden superar 365' })
  diasAlertaVencimiento?: number;
}
