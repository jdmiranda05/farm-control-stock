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
/** Validación de formato de correo (la usan el login y los formularios). */
export const PATRON_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function esCorreoValido(correo: string): boolean {
  const valor = correo.trim();
  return valor.length <= 254 && !valor.includes('..') && PATRON_CORREO.test(valor);
}

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

/**
 * ¿El producto se vende fraccionado en blísters?
 * Un producto SIN blísters (frascos, jarabes, cremas, cajas que no se abren)
 * se guarda con `unidades_por_caja = 1`: cada "caja" es una unidad de venta.
 */
export function tieneBlisters(producto: { unidades_por_caja: number }): boolean {
  return Number(producto.unidades_por_caja) > 1;
}

/** Nombre de la unidad mínima de venta del producto (para textos). */
export function nombreUnidadMinima(producto: { unidades_por_caja: number }, plural = true): string {
  if (tieneBlisters(producto)) return plural ? 'blísters' : 'blíster';
  return plural ? 'unidades' : 'unidad';
}

/** "1 unidad" / "3 unidades": plural en español sin "(s)". */
export function pluralizar(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${Math.abs(cantidad) === 1 ? singular : plural}`;
}

/**
 * Nombre de la unidad de un movimiento (kardex, reportes, ventas):
 *   CAJA de un producto con blísters  -> "caja(s)"
 *   CAJA de un producto sin blísters  -> "unidad(es)" (frasco, tubo…)
 *   BLISTER                           -> "blíster(s)"
 */
export function textoCantidad(
  cantidad: number,
  unidad: UnidadEmpaque,
  producto?: { unidades_por_caja: number } | null,
): string {
  if (unidad === UnidadEmpaque.BLISTER) return pluralizar(cantidad, 'blíster', 'blísters');
  if (producto && !tieneBlisters(producto)) return pluralizar(cantidad, 'unidad', 'unidades');
  return pluralizar(cantidad, 'caja', 'cajas');
}

/** Datos de empaque que se validan al crear o editar un producto. */
export interface DatosEmpaque {
  tieneBlisters: boolean;
  unidadesPorCaja: number;
  precioCaja: number;
  precioBlister: number;
}

/**
 * Reglas de negocio del empaque. Las usan el formulario (para avisar antes de
 * enviar) y el backend (para rechazar datos inconsistentes). Devuelve la lista
 * de errores; vacía si todo es correcto.
 */
export function validarEmpaque(datos: DatosEmpaque): string[] {
  const errores: string[] = [];
  const { unidadesPorCaja, precioCaja, precioBlister } = datos;

  if (!Number.isFinite(precioCaja) || precioCaja <= 0) {
    errores.push(
      datos.tieneBlisters
        ? 'El precio por caja debe ser mayor que 0'
        : 'El precio de venta debe ser mayor que 0',
    );
  }

  if (!datos.tieneBlisters) return errores;

  if (!Number.isInteger(unidadesPorCaja) || unidadesPorCaja < 2) {
    errores.push('Si el producto tiene blísters, la caja debe contener al menos 2 blísters');
  }
  if (unidadesPorCaja > 500) {
    errores.push('La cantidad de blísters por caja no puede superar 500');
  }
  if (!Number.isFinite(precioBlister) || precioBlister <= 0) {
    errores.push('El precio por blíster debe ser mayor que 0');
  } else if (precioCaja > 0 && precioBlister >= precioCaja) {
    errores.push('El precio por blíster debe ser menor que el precio de la caja');
  } else if (
    precioCaja > 0 &&
    unidadesPorCaja >= 2 &&
    Number((precioBlister * unidadesPorCaja).toFixed(2)) < precioCaja
  ) {
    errores.push(
      `Vender los ${unidadesPorCaja} blísters por separado no puede costar menos que la caja ` +
        `completa (${formatearSoles(precioBlister * unidadesPorCaja)} < ${formatearSoles(precioCaja)})`,
    );
  }
  return errores;
}

/** Formatea un importe en soles peruanos: 24.5 -> "S/ 24.50". */
export function formatearSoles(monto: number | null | undefined): string {
  const valor = Number(monto ?? 0);
  return `S/ ${valor.toFixed(2)}`;
}
