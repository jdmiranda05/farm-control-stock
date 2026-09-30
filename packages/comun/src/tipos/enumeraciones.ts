/**
 * Enumeraciones compartidas del sistema.
 * Se usan tanto en el backend (validaciones, lógica de negocio)
 * como en el frontend (etiquetas, colores, filtros).
 * Los valores coinciden con los tipos ENUM de PostgreSQL (supabase/esquema.sql).
 */

/**
 * Los TRES roles del sistema (control de acceso basado en roles / RBAC).
 * Las reglas completas de qué puede hacer cada uno están documentadas en
 * el backend, en los decoradores @Roles(...) de cada endpoint.
 */
export enum RolUsuario {
  /** Control total: configuración, reactivar productos, corregir el kardex. */
  ADMIN = 'ADMIN',
  /** Recepción de mercadería: entradas manuales, lotes, proveedores y merma. */
  ALMACENERO = 'ALMACENERO',
  /** Solo el punto de venta (POS): consulta stock y registra ventas. */
  VENDEDOR = 'VENDEDOR',
}

/** Tipos de movimiento registrados en el Kardex. */
export enum TipoMovimientoKardex {
  /** Recepción de una compra a un proveedor (la registra el almacenero). */
  ENTRADA_MANUAL = 'ENTRADA_MANUAL',
  /** Descuento AUTOMÁTICO generado al completar una venta en el POS. */
  SALIDA_VENTA = 'SALIDA_VENTA',
  /** Pérdida por vencimiento o daño; se valoriza en soles. */
  SALIDA_MERMA = 'SALIDA_MERMA',
  /** Corrección manual del historial, reservada al rol ADMIN. */
  AJUSTE_ADMIN = 'AJUSTE_ADMIN',
}

/**
 * Unidad de empaque con la que se expresa un movimiento o una venta.
 * La unidad BASE del sistema es el BLÍSTER:
 *   1 CAJA = `producto.unidades_por_caja` BLÍSTERS
 */
export enum UnidadEmpaque {
  CAJA = 'CAJA',
  BLISTER = 'BLISTER',
}

/** Tipos de alerta que genera el sistema. */
export enum TipoAlerta {
  /** El stock total del producto llegó a su umbral mínimo. */
  STOCK_MINIMO = 'STOCK_MINIMO',
  /** Un lote vence dentro del rango de días configurado por la botica. */
  VENCIMIENTO_PROXIMO = 'VENCIMIENTO_PROXIMO',
  /** Un lote ya venció y todavía tiene mercadería sin retirar. */
  VENCIDO = 'VENCIDO',
}

/** Ciclo de vida de una alerta. */
export enum EstadoAlerta {
  ACTIVA = 'ACTIVA',
  RESUELTA = 'RESUELTA',
}

/**
 * Semáforo visual de tres estados. Se usa para dos indicadores distintos:
 *
 *  ESTADO DE STOCK (regla del requisito 5):
 *    VERDE    -> stock > stock_minimo
 *    AMARILLO -> stock <= stock_minimo (pero mayor que la mitad)
 *    ROJO     -> stock = 0  o  stock <= stock_minimo / 2
 *
 *  ESTADO DE VENCIMIENTO:
 *    VERDE    -> sin vencimientos cercanos
 *    AMARILLO -> vence dentro de los días configurados por la botica
 *    ROJO     -> hay mercadería vencida sin retirar
 */
export enum EstadoSemaforo {
  VERDE = 'VERDE',
  AMARILLO = 'AMARILLO',
  ROJO = 'ROJO',
}
