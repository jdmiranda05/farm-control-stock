import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Printer,
  Receipt,
  TrendingDown,
  TriangleAlert,
} from 'lucide-react';
import {
  TipoMovimientoKardex,
  UnidadEmpaque,
  formatearSoles,
  hoyIso,
  type ReporteDiario as ReporteDiarioTipo,
  type ResumenMerma,
} from '@botica/comun';
import { api } from '../lib/api';
import { TarjetaKpi } from '../componentes/ui/TarjetaKpi';
import { Paginacion } from '../componentes/ui/Paginacion';
import { Cargando } from '../componentes/ui/Cargando';

/** Etiqueta legible de cada tipo de movimiento. */
const ETIQUETA_TIPO: Record<TipoMovimientoKardex, { texto: string; clases: string }> = {
  [TipoMovimientoKardex.ENTRADA_MANUAL]: {
    texto: 'Entrada manual',
    clases: 'bg-emerald-50 text-emerald-700',
  },
  [TipoMovimientoKardex.SALIDA_VENTA]: {
    texto: 'Salida por venta',
    clases: 'bg-blue-50 text-blue-700',
  },
  [TipoMovimientoKardex.SALIDA_MERMA]: {
    texto: 'Salida por merma',
    clases: 'bg-red-50 text-red-700',
  },
  [TipoMovimientoKardex.AJUSTE_ADMIN]: {
    texto: 'Ajuste admin.',
    clases: 'bg-purple-50 text-purple-700',
  },
};

/**
 * Pantalla de REPORTE DE ENTRADAS Y SALIDAS.
 *
 * Contiene:
 *   1. Filtro por fecha (por defecto hoy) o por rango.
 *   2. Tarjetas KPI con el resumen del periodo y su valorización en soles.
 *   3. Tabla detallada de movimientos, paginada desde el servidor.
 *   4. Resumen de merma económica acumulada.
 */
export function ReporteDiario() {
  const [desde, setDesde] = useState(hoyIso());
  const [hasta, setHasta] = useState(hoyIso());
  const [pagina, setPagina] = useState(1);
  const [reporte, setReporte] = useState<ReporteDiarioTipo | null>(null);
  const [merma, setMerma] = useState<ResumenMerma | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    const parametros = new URLSearchParams({
      desde,
      hasta,
      pagina: String(pagina),
      porPagina: '10',
    });
    api
      .get<ReporteDiarioTipo>(`/reportes/diario?${parametros}`)
      .then(setReporte)
      .catch((e: Error) => setError(e.message));
  }, [desde, hasta, pagina]);

  useEffect(cargar, [cargar]);

  useEffect(() => {
    api
      .get<ResumenMerma>('/reportes/merma')
      .then(setMerma)
      .catch(() => setMerma(null));
  }, []);

  /** Atajos de rango más usados en la botica. */
  function aplicarAtajo(dias: number) {
    const hoy = new Date();
    const inicio = new Date();
    inicio.setDate(hoy.getDate() - dias);
    const aTexto = (fecha: Date) => fecha.toISOString().slice(0, 10);
    setDesde(aTexto(inicio));
    setHasta(aTexto(hoy));
    setPagina(1);
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }
  if (!reporte) return <Cargando mensaje="Generando reporte…" />;

  const { kpis, movimientos } = reporte;
  const esUnSoloDia = reporte.desde === reporte.hasta;

  return (
    <div className="space-y-6">
      {/* Encabezado con botón de impresión */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte de Entradas y Salidas</h1>
          <p className="text-sm text-gray-500">
            {esUnSoloDia
              ? `Movimientos del ${new Date(`${reporte.desde}T12:00`).toLocaleDateString('es-PE', { dateStyle: 'long' })}`
              : `Del ${reporte.desde} al ${reporte.hasta}`}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 print:hidden"
        >
          <Printer className="h-4 w-4" /> Imprimir reporte
        </button>
      </div>

      {/* ══════ Filtros de fecha ══════ */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPagina(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPagina(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setDesde(hoyIso());
              setHasta(hoyIso());
              setPagina(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Hoy
          </button>
          <button
            onClick={() => aplicarAtajo(7)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => aplicarAtajo(30)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Últimos 30 días
          </button>
        </div>
      </div>

      {/* ══════ KPIs del periodo ══════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TarjetaKpi
          titulo="Ingresado"
          valor={`${kpis.cajasIngresadas} caja(s)`}
          Icono={ArrowDownToLine}
          tono="verde"
          descripcion={`${kpis.blistersIngresados} blíster(es) en total`}
        />
        <TarjetaKpi
          titulo="Retirado"
          valor={`${kpis.blistersRetirados} blíster(es)`}
          Icono={ArrowUpFromLine}
          tono="azul"
          descripcion={`${kpis.blistersVendidos} por venta · ${kpis.blistersMerma} por merma`}
        />
        <TarjetaKpi
          titulo="Comprobantes emitidos"
          valor={kpis.cantidadVentas}
          Icono={Receipt}
          tono="gris"
          descripcion="Ventas registradas en el periodo"
        />
        <TarjetaKpi
          titulo="Valor de entradas"
          valor={formatearSoles(kpis.valorEntradasSoles)}
          Icono={Coins}
          tono="verde"
          descripcion="Costo de la mercadería recibida"
        />
        <TarjetaKpi
          titulo="Valor de ventas"
          valor={formatearSoles(kpis.valorVentasSoles)}
          Icono={Coins}
          tono="azul"
          descripcion="Ingresos por ventas del periodo"
        />
        <TarjetaKpi
          titulo="Pérdida por merma"
          valor={formatearSoles(kpis.valorMermaSoles)}
          Icono={TrendingDown}
          tono="rojo"
          descripcion="Mercadería vencida o dañada"
        />
      </div>

      {/* ══════ Tabla detallada de movimientos ══════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Detalle de movimientos</h2>
          <p className="text-xs text-gray-500">
            Hora, producto, tipo, cantidad, lote, responsable y proveedor
          </p>
        </div>

        {movimientos.datos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No hubo movimientos en el periodo seleccionado.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Hora</th>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3 text-center">Cantidad</th>
                    <th className="px-5 py-3">Lote</th>
                    <th className="px-5 py-3">Responsable</th>
                    <th className="px-5 py-3">Proveedor</th>
                    <th className="px-5 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movimientos.datos.map((movimiento) => {
                    const etiqueta = ETIQUETA_TIPO[movimiento.tipo];
                    const entrada = movimiento.tipo === TipoMovimientoKardex.ENTRADA_MANUAL;
                    return (
                      <tr key={movimiento.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                          {new Date(movimiento.creado_en).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {!esUnSoloDia && (
                            <p className="text-xs text-gray-400">
                              {new Date(movimiento.creado_en).toLocaleDateString('es-PE')}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {movimiento.producto?.nombre ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${etiqueta.clases}`}
                          >
                            {etiqueta.texto}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`font-semibold ${entrada ? 'text-emerald-600' : 'text-gray-800'}`}
                          >
                            {entrada ? '+' : '−'}
                            {movimiento.cantidad}
                          </span>
                          <span className="text-xs text-gray-400">
                            {' '}
                            {movimiento.unidad === UnidadEmpaque.CAJA ? 'caja(s)' : 'blíster(es)'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {movimiento.lote?.numero_lote ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {movimiento.usuario?.nombre_completo ?? 'Sistema'}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {movimiento.proveedor?.nombre ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-gray-700">
                          {formatearSoles(movimiento.valor_soles)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="print:hidden">
              <Paginacion
                pagina={movimientos.pagina}
                totalPaginas={movimientos.totalPaginas}
                total={movimientos.total}
                porPagina={movimientos.porPagina}
                onCambiar={setPagina}
              />
            </div>
          </>
        )}
      </div>

      {/* ══════ Merma económica acumulada ══════ */}
      {merma && (merma.totalRegistradaSoles > 0 || merma.totalPotencialSoles > 0) && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <TriangleAlert className="h-4 w-4 text-red-500" />
              Merma económica acumulada
            </h2>
            <p className="text-xs text-gray-500">
              Pérdidas históricas por medicamentos vencidos o dañados, valorizadas al costo
              de compra
            </p>
          </div>

          <div className="grid gap-4 border-b border-gray-100 p-5 sm:grid-cols-2">
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs font-medium text-red-700">Merma ya declarada</p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {formatearSoles(merma.totalRegistradaSoles)}
              </p>
              <p className="mt-1 text-xs text-red-600">
                Mercadería retirada y registrada como pérdida
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-700">Merma potencial</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {formatearSoles(merma.totalPotencialSoles)}
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Producto vencido que sigue en almacén sin declararse
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3 text-center">Blísters perdidos</th>
                  <th className="px-5 py-3 text-right">Merma declarada</th>
                  <th className="px-5 py-3 text-center">Vencidos sin declarar</th>
                  <th className="px-5 py-3 text-right">Merma potencial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {merma.productos.map((item) => (
                  <tr key={item.producto_id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{item.producto_nombre}</p>
                      <p className="text-xs text-gray-400">{item.codigo ?? 'sin código'}</p>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-700">
                      {item.blisters_merma_registrada}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-red-600">
                      {formatearSoles(item.merma_registrada_soles)}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-700">
                      {item.blisters_vencidos_sin_declarar}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-amber-600">
                      {formatearSoles(item.merma_potencial_soles)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
