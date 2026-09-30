import { UnidadEmpaque } from '../tipos/enumeraciones';

/**
 * Conversión entre CAJAS y BLÍSTERS.
 *
 * Regla central del sistema: la unidad BASE con la que se calcula todo el
 * stock es el BLÍSTER. Una caja equivale a `unidadesPorCaja` blísters.
 * Estas funciones viven en el paquete compartido para que el backend y el
 * frontend hagan exactamente la misma cuenta y nunca se contradigan.
 */

/** Convierte una cantidad expresada en `unidad` a su equivalente en blísters. */
export function aBlisters(
  cantidad: number,
  unidad: UnidadEmpaque,
  unidadesPorCaja: number,
): number {
  return unidad === UnidadEmpaque.CAJA ? cantidad * Math.max(unidadesPorCaja, 1) : cantidad;
}

/**
 * Descompone una cantidad de blísters en "X cajas + Y blísters".
 * Sirve para mostrar el stock de forma entendible para el boticario:
 *   37 blísters con cajas de 10 -> { cajas: 3, blisters: 7 }
 */
export function desdeBlisters(
  totalBlisters: number,
  unidadesPorCaja: number,
): { cajas: number; blisters: number } {
  const porCaja = Math.max(unidadesPorCaja, 1);
  return {
    cajas: Math.floor(totalBlisters / porCaja),
    blisters: totalBlisters % porCaja,
  };
}

/**
 * Texto legible del stock para las tablas del frontend.
 *   formatearStock(37, 10) -> "3 cajas + 7 blísters (37)"
 *   formatearStock(18, 1)  -> "18 unidades"
 */
export function formatearStock(totalBlisters: number, unidadesPorCaja: number): string {
  // Productos que se venden por unidad (frascos, geles): no hay blísters.
  if (unidadesPorCaja <= 1) {
    return `${totalBlisters} unidad${totalBlisters === 1 ? '' : 'es'}`;
  }

  const { cajas, blisters } = desdeBlisters(totalBlisters, unidadesPorCaja);
  if (cajas === 0) return `${blisters} blíster${blisters === 1 ? '' : 's'}`;
  if (blisters === 0) return `${cajas} caja${cajas === 1 ? '' : 's'} (${totalBlisters})`;
  return `${cajas} caja${cajas === 1 ? '' : 's'} + ${blisters} blíster${
    blisters === 1 ? '' : 's'
  } (${totalBlisters})`;
}

/** Formatea un importe en soles peruanos: 24.5 -> "S/ 24.50". */
export function formatearSoles(monto: number | null | undefined): string {
  const valor = Number(monto ?? 0);
  return `S/ ${valor.toFixed(2)}`;
}
