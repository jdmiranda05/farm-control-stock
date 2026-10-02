import { PartialType } from '@nestjs/mapped-types';
import { CrearProductoDto } from './crear-producto.dto';

/**
 * DTO de actualización (PATCH /api/productos/:id).
 * PartialType reutiliza CrearProductoDto volviendo TODOS sus campos
 * opcionales, pero conservando las validaciones de cada uno.
 */
export class ActualizarProductoDto extends PartialType(CrearProductoDto) {}
