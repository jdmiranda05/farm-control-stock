import { RolUsuario, type PerfilUsuario } from '@botica/comun';

/**
 * Permisos del lado del cliente (RBAC).
 *
 * IMPORTANTE para la sustentación: estas funciones solo deciden qué se
 * MUESTRA en pantalla. La seguridad real vive en el backend, donde cada
 * endpoint está protegido con @Roles(...). Ocultar un botón mejora la
 * experiencia de uso, pero nunca sustituye a la validación del servidor.
 *
 * Reparto de responsabilidades:
 *   - ADMIN      -> solo funciones ADMINISTRATIVAS: catálogo y proveedores
 *                   (registrar, editar, dar de baja), configuración,
 *                   supervisión (dashboard, kardex, reportes) y correcciones.
 *                   No vende ni opera el almacén.
 *   - ALMACENERO -> entradas de mercadería, mermas y lotes. Consulta el
 *                   catálogo y los proveedores, pero no los modifica.
 *   - VENDEDOR   -> punto de venta.
 */

/** Etiquetas legibles de cada rol, para mostrarlas en la interfaz. */
export const NOMBRE_ROL: Record<RolUsuario, string> = {
  [RolUsuario.ADMIN]: 'Administrador',
  [RolUsuario.ALMACENERO]: 'Almacenero',
  [RolUsuario.VENDEDOR]: 'Vendedor',
};

type Perfil = PerfilUsuario | null;

/** Funciones administrativas: configuración, correcciones, reactivaciones. */
export function esAdmin(perfil: Perfil): boolean {
  return perfil?.rol === RolUsuario.ADMIN;
}

/** Recepción de mercadería, lotes y merma: exclusivo del ALMACENERO. */
export function puedeGestionarInventario(perfil: Perfil): boolean {
  return perfil?.rol === RolUsuario.ALMACENERO;
}

/** Registrar, editar y dar de baja proveedores: exclusivo del ADMIN. */
export function puedeEditarProveedores(perfil: Perfil): boolean {
  return perfil?.rol === RolUsuario.ADMIN;
}

/** Ver el directorio de proveedores (el ALMACENERO lo consulta). */
export function puedeVerProveedores(perfil: Perfil): boolean {
  return perfil?.rol === RolUsuario.ALMACENERO || perfil?.rol === RolUsuario.ADMIN;
}

/** Punto de venta: exclusivo del VENDEDOR. */
export function puedeVender(perfil: Perfil): boolean {
  return perfil?.rol === RolUsuario.VENDEDOR;
}

/** Registrar productos y categorías nuevos: exclusivo del ADMIN. */
export function puedeCrearEnCatalogo(perfil: Perfil): boolean {
  return perfil?.rol === RolUsuario.ADMIN;
}

/** Editar, deshabilitar y eliminar productos o categorías: solo ADMIN. */
export function puedeEditarCatalogo(perfil: Perfil): boolean {
  return perfil?.rol === RolUsuario.ADMIN;
}

/** Reportes gerenciales: costos, valorizaciones y pérdidas. */
export function puedeVerReportes(perfil: Perfil): boolean {
  return perfil?.rol === RolUsuario.ADMIN || perfil?.rol === RolUsuario.ALMACENERO;
}
