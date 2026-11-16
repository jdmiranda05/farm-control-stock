/**
 * Fechas del negocio en hora de PERÚ (UTC−5, sin horario de verano).
 *
 * La base de datos guarda los instantes en UTC. Si un filtro "del 15/11"
 * usara la medianoche UTC, una venta de las 8:00 p. m. hora peruana
 * (01:00 UTC del día siguiente) caería en el reporte del 16/11. Por eso los
 * rangos de fechas se expresan siempre con el desfase de Lima.
 */
export const DESFASE_PERU = '-05:00';
const DESFASE_MS = 5 * 60 * 60 * 1000;

/** Primer instante del día en Lima: "2026-11-15" -> "2026-11-15T00:00:00-05:00". */
export function inicioDelDia(fecha: string): string {
  return `${fecha.slice(0, 10)}T00:00:00${DESFASE_PERU}`;
}

/** Último instante del día en Lima: "2026-11-15" -> "2026-11-15T23:59:59.999-05:00". */
export function finDelDia(fecha: string): string {
  return `${fecha.slice(0, 10)}T23:59:59.999${DESFASE_PERU}`;
}

/**
 * Convierte un instante (ISO en UTC) en un Date cuyas horas "UTC" son las de
 * Lima. Excel no maneja zonas horarias: así la celda muestra la hora peruana.
 */
export function fechaParaExcel(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() - DESFASE_MS);
}

/** Fecha de calendario (AAAA-MM-DD) como Date de Excel, sin desfase. */
export function diaParaExcel(fecha: string | null | undefined): Date | null {
  if (!fecha) return null;
  return new Date(`${fecha.slice(0, 10)}T00:00:00Z`);
}
