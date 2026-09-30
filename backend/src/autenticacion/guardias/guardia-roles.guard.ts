import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { CLAVE_ROLES } from '../decoradores/roles.decorator';

/** Nombres legibles de los roles, para los mensajes de error. */
const NOMBRE_ROL: Record<RolUsuario, string> = {
  [RolUsuario.ADMIN]: 'Administrador',
  [RolUsuario.ALMACENERO]: 'Almacenero',
  [RolUsuario.VENDEDOR]: 'Vendedor',
};

/**
 * Guardia global de autorización por roles (RBAC).
 * Se ejecuta DESPUÉS de GuardiaAutenticacion, cuando `peticion.usuario` ya existe.
 *
 * Reglas:
 *   - Endpoint sin @Roles(...)  -> basta con estar autenticado.
 *   - Usuario con rol ADMIN     -> accede siempre (tiene control total).
 *   - En cualquier otro caso    -> su rol debe estar en la lista permitida.
 */
@Injectable()
export class GuardiaRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<RolUsuario[]>(CLAVE_ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    // Sin restricción declarada: cualquier usuario autenticado puede entrar.
    if (!rolesPermitidos || rolesPermitidos.length === 0) return true;

    const peticion = contexto.switchToHttp().getRequest();
    const usuario: PerfilUsuario | undefined = peticion.usuario;

    // Endpoint público sin usuario (caso borde): no aplica restricción de rol.
    if (!usuario) return true;

    // El ADMIN tiene control total del sistema.
    if (usuario.rol === RolUsuario.ADMIN) return true;

    if (!rolesPermitidos.includes(usuario.rol)) {
      const permitidos = rolesPermitidos.map((rol) => NOMBRE_ROL[rol]).join(' o ');
      throw new ForbiddenException(
        `Acceso denegado: esta operación es solo para ${permitidos}. ` +
          `Su rol actual es ${NOMBRE_ROL[usuario.rol]}.`,
      );
    }
    return true;
  }
}
