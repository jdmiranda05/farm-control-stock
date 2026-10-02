import { useEffect, useState } from 'react';
import {
  BellRing,
  Boxes,
  CalendarClock,
  Coins,
  OctagonAlert,
  Package,
  TrendingDown,
  TriangleAlert,
} from 'lucide-react';
import {
  formatearFecha,
  formatearSoles,
  formatearStock,
  type ResumenPanel,
} from '@botica/comun';
import { api } from '../lib/api';
import { TarjetaKpi } from '../componentes/ui/TarjetaKpi';
import { EtiquetaEstado } from '../componentes/ui/EtiquetaEstado';
import { Cargando } from '../componentes/ui/Cargando';

/**
 * DASHBOARD (pantalla principal de ADMIN y ALMACENERO):
 *   1. Tarjetas KPI con las métricas clave del negocio.
 *   2. Tabla de productos que requieren atención (stock bajo, crítico,
 *      próximos a vencer o con mercadería vencida).
 */
export function PanelControl() {
  const [resumen, setResumen] = useState<ResumenPanel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ResumenPanel>('/panel/resumen')
      .then(setResumen)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">No se pudo cargar el resumen</p>
        <p className="mt-1 text-sm">{error}</p>
        <p className="mt-2 text-sm">
          Verifique que el backend esté en ejecución (<code>pnpm dev:backend</code>).
        </p>
      </div>
    );
  }

  if (!resumen) return <Cargando mensaje="Cargando métricas…" />;

  const { kpis, productosAtencion } = resumen;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Resumen general del inventario, las ventas y las alertas de la botica
        </p>
      </div>

      {/* ══════ Tarjetas de métricas (KPIs) ══════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TarjetaKpi
          titulo="Ventas de hoy"
          valor={formatearSoles(kpis.ventasHoySoles)}
          Icono={Coins}
          tono="verde"
          descripcion="Ingresos registrados en el punto de venta"
        />
        <TarjetaKpi
          titulo="Productos activos"
          valor={kpis.totalProductos}
          Icono={Package}
          tono="azul"
          descripcion={`${kpis.blistersEnStock} blíster(es) en stock`}
        />
        <TarjetaKpi
          titulo="Alertas activas"
          valor={kpis.alertasActivas}
          Icono={BellRing}
          tono="ambar"
        />
        <TarjetaKpi
          titulo="Stock en atención"
          valor={kpis.productosStockBajo}
          Icono={TrendingDown}
          tono="ambar"
          descripcion="Productos que rozan su stock mínimo"
        />
        <TarjetaKpi
          titulo="Stock crítico"
          valor={kpis.productosStockCritico}
          Icono={TriangleAlert}
          tono="rojo"
          descripcion="Sin stock o bajo la mitad del mínimo"
        />
        <TarjetaKpi
          titulo="Merma acumulada"
          valor={formatearSoles(kpis.mermaAcumuladaSoles)}
          Icono={OctagonAlert}
          tono="rojo"
          descripcion="Pérdidas declaradas históricas"
        />
        <TarjetaKpi
          titulo="Lotes por vencer"
          valor={kpis.lotesPorVencer}
          Icono={CalendarClock}
          tono="ambar"
          descripcion="Dentro del rango configurado"
        />
        <TarjetaKpi
          titulo="Lotes vencidos"
          valor={kpis.lotesVencidos}
          Icono={OctagonAlert}
          tono="rojo"
          descripcion="Con mercadería sin retirar"
        />
        <TarjetaKpi
          titulo="Unidades en stock"
          valor={kpis.blistersEnStock}
          Icono={Boxes}
          tono="gris"
          descripcion="Blísters disponibles (sin vencidos)"
        />
      </div>

      {/* ══════ Productos que requieren atención ══════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Productos que requieren atención</h2>
          <p className="text-xs text-gray-500">
            Stock bajo o crítico, próximos a vencer o con mercadería vencida (los más
            urgentes primero)
          </p>
        </div>

        {productosAtencion.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-emerald-600">
            ¡Todo en orden! Ningún producto requiere atención por ahora.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Stock actual</th>
                  <th className="px-5 py-3">Estado de stock</th>
                  <th className="px-5 py-3 text-center">Vencidos</th>
                  <th className="px-5 py-3">Próximo vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productosAtencion.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      <p className="text-xs text-gray-400">{producto.codigo ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {producto.categoria_nombre ?? 'Sin categoría'}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-800">
                        {formatearStock(producto.stock_blisters, producto.unidades_por_caja)}
                      </p>
                      <p className="text-xs text-gray-400">
                        mínimo: {producto.stock_minimo}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <EtiquetaEstado estado={producto.estado_stock} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      {producto.blisters_vencidos > 0 ? (
                        <span className="font-semibold text-red-600">
                          {producto.blisters_vencidos}
                        </span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {producto.proxima_fecha_vencimiento ? (
                        <>
                          {formatearFecha(producto.proxima_fecha_vencimiento)}
                          {producto.dias_para_vencer !== null && (
                            <span className="ml-1 text-xs text-gray-400">
                              (en {producto.dias_para_vencer} días)
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
