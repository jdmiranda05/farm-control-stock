import { MovimientoDetallado, TipoMovimientoKardex, textoCantidad } from '@botica/comun';
import { ColumnaExcel } from './excel';
import { diaParaExcel, fechaParaExcel } from './fechas-peru';

/** Nombre legible de cada tipo de movimiento. */
export const NOMBRE_TIPO_MOVIMIENTO: Record<TipoMovimientoKardex, string> = {
  [TipoMovimientoKardex.ENTRADA_MANUAL]: 'Entrada (compra)',
  [TipoMovimientoKardex.SALIDA_VENTA]: 'Salida por venta',
  [TipoMovimientoKardex.SALIDA_MERMA]: 'Salida por merma',
  [TipoMovimientoKardex.AJUSTE_ADMIN]: 'Ajuste administrativo',
};

const esEntrada = (m: MovimientoDetallado) => m.tipo === TipoMovimientoKardex.ENTRADA_MANUAL;

/**
 * Columnas del kardex en Excel (las usan el Kardex y el Reporte diario).
 * Entradas y salidas van en columnas separadas para poder sumarlas.
 */
export const COLUMNAS_MOVIMIENTOS: ColumnaExcel<MovimientoDetallado>[] = [
  { titulo: 'Fecha y hora', ancho: 17, formato: 'fechaHora', valor: (m) => fechaParaExcel(m.creado_en) },
  { titulo: 'Tipo', ancho: 21, valor: (m) => NOMBRE_TIPO_MOVIMIENTO[m.tipo] ?? m.tipo },
  { titulo: 'Código', ancho: 11, valor: (m) => m.producto?.codigo ?? '' },
  { titulo: 'Producto', ancho: 38, valor: (m) => m.producto?.nombre ?? '' },
  { titulo: 'Lote', ancho: 15, valor: (m) => m.lote?.numero_lote ?? '' },
  { titulo: 'Vence', ancho: 12, formato: 'fecha', valor: (m) => diaParaExcel(m.lote?.fecha_vencimiento) },
  {
    titulo: 'Cantidad',
    ancho: 16,
    valor: (m) => textoCantidad(m.cantidad, m.unidad, m.producto),
  },
  {
    titulo: 'Ingreso (blísters/unid.)',
    ancho: 14,
    formato: 'entero',
    sumar: true,
    valor: (m) => (esEntrada(m) ? m.cantidad_blisters : null),
  },
  {
    titulo: 'Salida (blísters/unid.)',
    ancho: 14,
    formato: 'entero',
    sumar: true,
    valor: (m) => (esEntrada(m) || m.tipo === TipoMovimientoKardex.AJUSTE_ADMIN ? null : m.cantidad_blisters),
  },
  { titulo: 'Valor (S/)', ancho: 13, formato: 'soles', sumar: true, valor: (m) => Number(m.valor_soles) },
  { titulo: 'Proveedor', ancho: 30, valor: (m) => m.proveedor?.nombre ?? '' },
  { titulo: 'Responsable', ancho: 24, valor: (m) => m.usuario?.nombre_completo ?? '' },
  { titulo: 'Detalle', ancho: 48, valor: (m) => m.motivo ?? '' },
  { titulo: 'Corregido', ancho: 11, valor: (m) => (m.editado ? 'Sí' : '') },
];
