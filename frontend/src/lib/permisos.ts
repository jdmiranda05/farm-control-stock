import { RolUsuario, type PerfilUsuario } from '@botica/comun';

/**
 * Permisos del lado del cliente (RBAC).
 *
 * IMPORTANTE para la sustentación: estas funciones solo deciden qué se
 * MUESTRA en pantalla. La seguridad real vive en el backend, donde cada
 * endpoint está protegido con @Roles(...). Ocultar un botón mejora la
 * experiencia de uso, pero nunca sustituye a la validación del servidor.
 */

/** Etiquetas legibles de cada rol, para mostrarlas en la interfaz. */
export const NOMBRE_ROL: Record<RolUsuario, string> = {
  [RolUsuario.ADMIN]: 'Administrador',
  [RolUsuario.ALMACENERO]: 'Almacenero',
  [RolUsuario.VENDEDOR]: 'Vendedor',
};

/** El ADMIN tiene control total del sistema. */
export function esAdmin(perfil: PerfilUsuario | null): boolean {
  return perfil?.rol === RolUsuario.ADMIN;
}

/** Recepción de mercadería, lotes, proveedores y merma. */
export function puedeGestionarInventario(perfil: PerfilUsuario | null): boolean {
  return perfil?.rol === RolUsuario.ADMIN || perfil?.rol === RolUsuario.ALMACENERO;
}

/** Acceso al punto de venta. */
export function puedeVender(perfil: PerfilUsuario | null): boolean {
  return perfil?.rol === RolUsuario.ADMIN || perfil?.rol === RolUsuario.VENDEDOR;
}

/** Reportes gerenciales: costos, valorizaciones y pérdidas. */
export function puedeVerReportes(perfil: PerfilUsuario | null): boolean {
  return perfil?.rol === RolUsuario.ADMIN || perfil?.rol === RolUsuario.ALMACENERO;
}
