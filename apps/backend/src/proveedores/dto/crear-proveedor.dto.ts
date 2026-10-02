import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

/** DTO de creación de proveedor (POST /api/proveedores). */
export class CrearProveedorDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'El RUC debe tener exactamente 11 dígitos' })
  ruc?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  /** Nombre del ejecutivo de ventas asignado por el proveedor. */
  @IsOptional()
  @IsString()
  contacto?: string;
}
