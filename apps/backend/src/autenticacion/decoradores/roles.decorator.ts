import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '@botica/comun';

/** Clave de metadatos que consulta GuardiaRoles. */
export const CLAVE_ROLES = 'rolesPermitidos';

/**
 * Restringe un endpoint a ciertos roles.
 * El rol ADMIN_SISTEMA siempre tiene acceso (superadministrador del SaaS).
 *
 * Ejemplo:
 *   @Roles(RolUsuario.ADMIN_BOTICA)
 *   @Post()
 *   crearProducto(...) { ... }
 */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(CLAVE_ROLES, roles);
