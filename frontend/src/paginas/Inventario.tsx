import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowDownToLine, PackageOpen, TriangleAlert } from 'lucide-react';
import {
  EstadoSemaforo,
  UnidadEmpaque,
  diasParaVencer,
  formatearFecha,
  formatearSoles,
  type LoteDetallado,
  type ProductoConStock,
  type Proveedor,
  type RespuestaPaginada,
} from '@botica/comun';
import { api } from '../lib/api';
import { EtiquetaEstado } from '../componentes/ui/EtiquetaEstado';
import { Cargando } from '../componentes/ui/Cargando';
import { Paginacion } from '../componentes/ui/Paginacion';

/** Semáforo de un lote según cuánto le falta para vencer. */
function estadoDeLote(lote: LoteDetallado): { estado: EstadoSemaforo; texto: string } {
  const dias = diasParaVencer(lote.fecha_vencimiento);
  if (dias < 0) return { estado: EstadoSemaforo.ROJO, texto: `Vencido hace ${-dias} día(s)` };
  if (dias <= 30) return { estado: EstadoSemaforo.AMARILLO, texto: `Vence en ${dias} día(s)` };
  return { estado: EstadoSemaforo.VERDE, texto: `Vence en ${dias} día(s)` };
}

/**
 * Pantalla "Lotes e Inventario" (rol ALMACENERO).
 *
 * Aquí se registran las dos operaciones manuales del almacén:
 *   1. ENTRADA de mercadería: siempre en CAJAS, indicando lote, vencimiento,
 *      proveedor y costo de compra.
 *   2. MERMA: retiro de mercadería vencida o dañada, valorizada en soles.
 *
 * Las SALIDAS POR VENTA no aparecen aquí: son automáticas y las genera el
 * punto de venta aplicando FEFO.
 */
export function Inventario() {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [lotes, setLotes] = useState<RespuestaPaginada<LoteDetallado> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<'entrada' | 'merma' | null>(null);

  // Formulario de ENTRADA (recepción de compra)
  const [entrada, setEntrada] = useState({
    productoId: '',
    proveedorId: '',
    numeroLote: '',
    fechaVencimiento: '',
    cantidadCajas: '1',
    costoCaja: '',
  });

  // Formulario de MERMA
  const [merma, setMerma] = useState({
    loteId: '',
    cantidad: '1',
    unidad: UnidadEmpaque.CAJA as UnidadEmpaque,
    motivo: '',
  });

  const cargarCatalogos = useCallback(() => {
    Promise.all([
      api.get<ProductoConStock[]>('/productos'),
      api.get<Proveedor[]>('/proveedores'),
    ])
      .then(([listaProductos, listaProveedores]) => {
        setProductos(listaProductos);
        setProveedores(listaProveedores);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const cargarLotes = useCallback(() => {
    const parametros = new URLSearchParams({ pagina: String(pagina), porPagina: '10' });
    if (soloVencidos) parametros.set('soloVencidos', 'true');
    api
      .get<RespuestaPaginada<LoteDetallado>>(`/inventario/lotes?${parametros}`)
      .then(setLotes)
      .catch((e: Error) => setError(e.message));
  }, [pagina, soloVencidos]);

  useEffect(cargarCatalogos, [cargarCatalogos]);
  useEffect(cargarLotes, [cargarLotes]);

  async function registrarEntrada(evento: FormEvent) {
    evento.preventDefault();
    setProcesando('entrada');
    setError(null);
    setMensaje(null);
    try {
      await api.post('/inventario/entradas', {
        productoId: entrada.productoId,
        proveedorId: entrada.proveedorId || undefined,
        numeroLote: entrada.numeroLote,
        fechaVencimiento: entrada.fechaVencimiento,
        cantidadCajas: Number(entrada.cantidadCajas),
        costoCaja: Number(entrada.costoCaja),
      });
      setMensaje(`Entrada registrada: ${entrada.cantidadCajas} caja(s) del lote ${entrada.numeroLote}.`);
      setEntrada({
        productoId: '',
        proveedorId: '',
        numeroLote: '',
        fechaVencimiento: '',
        cantidadCajas: '1',
        costoCaja: '',
      });
      cargarCatalogos();
      cargarLotes();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesando(null);
    }
  }

  async function registrarMerma(evento: FormEvent) {
    evento.preventDefault();
    setProcesando('merma');
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await api.post<{ mensaje: string; valorMermaSoles: number }>(
        '/inventario/mermas',
        {
          loteId: merma.loteId,
          cantidad: Number(merma.cantidad),
          unidad: merma.unidad,
          motivo: merma.motivo,
        },
      );
      setMensaje(
        `${respuesta.mensaje} Pérdida valorizada en ${formatearSoles(respuesta.valorMermaSoles)}.`,
      );
      setMerma({ loteId: '', cantidad: '1', unidad: UnidadEmpaque.CAJA, motivo: '' });
      cargarCatalogos();
      cargarLotes();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lotes e Inventario</h1>
        <p className="text-sm text-gray-500">
          Recepción de mercadería y control de vencimientos por lote
        </p>
      </div>

      {mensaje && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ══════ ENTRADA MANUAL ══════ */}
        <form
          onSubmit={registrarEntrada}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownToLine className="h-4 w-4" />
            </span>
            Registrar entrada de mercadería
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Las entradas se registran siempre en CAJAS, tal como llegan del proveedor.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Producto *</label>
              <select
                required
                value={entrada.productoId}
                onChange={(e) => setEntrada({ ...entrada, productoId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Seleccione un producto…</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} ({producto.unidades_por_caja} blíster/caja)
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Proveedor</label>
              <select
                value={entrada.proveedorId}
                onChange={(e) => setEntrada({ ...entrada, proveedorId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Sin especificar</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">N° de lote *</label>
              <input
                required
                value={entrada.numeroLote}
                onChange={(e) => setEntrada({ ...entrada, numeroLote: e.target.value })}
                placeholder="L-PAR-2601"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                F. vencimiento *
              </label>
              <input
                required
                type="date"
                value={entrada.fechaVencimiento}
                onChange={(e) => setEntrada({ ...entrada, fechaVencimiento: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Cantidad de cajas *
              </label>
              <input
                required
                type="number"
                min="1"
                value={entrada.cantidadCajas}
                onChange={(e) => setEntrada({ ...entrada, cantidadCajas: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Costo por caja (S/) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={entrada.costoCaja}
                onChange={(e) => setEntrada({ ...entrada, costoCaja: e.target.value })}
                placeholder="4.20"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={procesando === 'entrada'}
            className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {procesando === 'entrada' ? 'Registrando…' : 'Registrar entrada'}
          </button>
        </form>

        {/* ══════ MERMA ══════ */}
        <form
          onSubmit={registrarMerma}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600">
              <TriangleAlert className="h-4 w-4" />
            </span>
            Registrar merma
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Retiro de mercadería vencida o dañada. El sistema calcula la pérdida en soles
            usando el costo de compra del lote.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Lote *</label>
              <select
                required
                value={merma.loteId}
                onChange={(e) => setMerma({ ...merma, loteId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Seleccione el lote afectado…</option>
                {(lotes?.datos ?? [])
                  .filter((lote) => lote.cajas_completas > 0 || lote.blisters_sueltos > 0)
                  .map((lote) => (
                    <option key={lote.id} value={lote.id}>
                      {lote.producto?.nombre} — {lote.numero_lote} (vence{' '}
                      {formatearFecha(lote.fecha_vencimiento)})
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                Se listan los lotes de la página actual de la tabla inferior
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Cantidad *</label>
              <input
                required
                type="number"
                min="1"
                value={merma.cantidad}
                onChange={(e) => setMerma({ ...merma, cantidad: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Unidad *</label>
              <select
                value={merma.unidad}
                onChange={(e) =>
                  setMerma({ ...merma, unidad: e.target.value as UnidadEmpaque })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value={UnidadEmpaque.CAJA}>Cajas</option>
                <option value={UnidadEmpaque.BLISTER}>Blísters</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Motivo *</label>
              <input
                required
                value={merma.motivo}
                onChange={(e) => setMerma({ ...merma, motivo: e.target.value })}
                placeholder="Vencido / Frasco roto en almacén"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={procesando === 'merma'}
            className="mt-4 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {procesando === 'merma' ? 'Registrando…' : 'Registrar merma'}
          </button>
        </form>
      </div>

      {/* ══════ Tabla de lotes (paginada) ══════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Lotes registrados</h2>
            <p className="text-xs text-gray-500">
              Ordenados por vencimiento: el más próximo aparece primero (orden FEFO)
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={soloVencidos}
              onChange={(e) => {
                setSoloVencidos(e.target.checked);
                setPagina(1);
              }}
              className="h-4 w-4 accent-red-600"
            />
            Ver solo vencidos
          </label>
        </div>

        {!lotes ? (
          <Cargando mensaje="Cargando lotes…" />
        ) : lotes.datos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            {soloVencidos
              ? 'No hay lotes vencidos. ¡Buen control de inventario!'
              : 'Aún no hay lotes registrados.'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3">N° lote</th>
                    <th className="px-5 py-3">Proveedor</th>
                    <th className="px-5 py-3">Vencimiento</th>
                    <th className="px-5 py-3 text-center">Existencias</th>
                    <th className="px-5 py-3 text-right">Costo/caja</th>
                    <th className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lotes.datos.map((lote) => {
                    const { estado, texto } = estadoDeLote(lote);
                    const porCaja = lote.producto?.unidades_por_caja ?? 1;
                    const totalBlisters =
                      lote.cajas_completas * porCaja + lote.blisters_sueltos;
                    return (
                      <tr key={lote.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {lote.producto?.nombre ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{lote.numero_lote}</td>
                        <td className="px-5 py-3 text-gray-600">
                          {lote.proveedor?.nombre ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                          {formatearFecha(lote.fecha_vencimiento)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <p className="font-medium text-gray-800">
                            {lote.cajas_completas} caja(s)
                          </p>
                          {lote.blisters_sueltos > 0 && (
                            <p className="flex items-center justify-center gap-1 text-xs text-blue-600">
                              <PackageOpen className="h-3 w-3" />
                              {lote.blisters_sueltos} blíster(es) sueltos
                            </p>
                          )}
                          <p className="text-xs text-gray-400">{totalBlisters} en total</p>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-700">
                          {formatearSoles(lote.costo_caja)}
                        </td>
                        <td className="px-5 py-3">
                          {totalBlisters === 0 ? (
                            <span className="text-xs text-gray-400">Agotado</span>
                          ) : (
                            <EtiquetaEstado estado={estado} texto={texto} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Paginacion
              pagina={lotes.pagina}
              totalPaginas={lotes.totalPaginas}
              total={lotes.total}
              porPagina={lotes.porPagina}
              onCambiar={setPagina}
            />
          </>
        )}
      </div>
    </div>
  );
}
