import { PartialType } from '@nestjs/mapped-types';
import { CrearProveedorDto } from './crear-proveedor.dto';

/**
 * DTO de actualización (PATCH /api/proveedores/:id).
 * PartialType vuelve opcionales todos los campos de CrearProveedorDto
 * conservando sus validaciones.
 */
export class ActualizarProveedorDto extends PartialType(CrearProveedorDto) {}
