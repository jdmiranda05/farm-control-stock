/**
 * Utilidades de fechas compartidas entre frontend y backend.
 * Se trabaja con cadenas `AAAA-MM-DD` (tipo DATE de PostgreSQL) y se parsea
 * manualmente para evitar el clásico desfase de un día por zona horaria
 * que produce `new Date('2026-01-01')` (lo interpreta como UTC).
 */

/** Convierte una cadena `AAAA-MM-DD` en un Date local (hora 00:00). */
export function aFechaLocal(fechaIso: string): Date {
  const [anio, mes, dia] = fechaIso.slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/**
 * Días que faltan para que venza una fecha, contados desde hoy.
 *  - Positivo: aún no vence (ej. 15 → vence en 15 días)
 *  - Cero:     vence hoy
 *  - Negativo: ya venció (ej. -3 → venció hace 3 días)
 */
export function diasParaVencer(fechaVencimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = aFechaLocal(fechaVencimiento);
  const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
  return Math.round((objetivo.getTime() - hoy.getTime()) / MILISEGUNDOS_POR_DIA);
}

/** Formatea `AAAA-MM-DD` como `dd/mm/aaaa` para mostrar al usuario. */
export function formatearFecha(fechaIso: string | null | undefined): string {
  if (!fechaIso) return '—';
  const fecha = aFechaLocal(fechaIso);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

/** Fecha de hoy en formato `AAAA-MM-DD` (útil para comparaciones en SQL). */
export function hoyIso(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}
