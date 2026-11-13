import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/** DTO de creación de proveedor (POST /api/proveedores). */
export class CrearProveedorDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  @Matches(/^(10|15|17|20)\d{9}$/, {
    message: 'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20',
  })
  ruc?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+()\s-]{6,20}$/, { message: 'El teléfono solo puede contener números, espacios, +, - y ()' })
  telefono?: string;

  /** Nombre del ejecutivo de ventas asignado por el proveedor. */
  @IsOptional()
  @IsString()
  contacto?: string;
}
