import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CircleAlert,
  Package,
  PackageOpen,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import {
  EstadoSemaforo,
  UnidadEmpaque,
  formatearFecha,
  formatearSoles,
  formatearStock,
  type ProductoConStock,
  type ResultadoVenta,
} from '@botica/comun';
import { api } from '../lib/api';
import { Cargando } from '../componentes/ui/Cargando';

/** Una línea del carrito, ya valorizada en el navegador. */
interface LineaCarrito {
  producto: ProductoConStock;
  modalidad: UnidadEmpaque;
  cantidad: number;
  precioUnitario: number;
}

/**
 * ════════════════════════════════════════════════════════════════
 *  PUNTO DE VENTA (POS) — pantalla principal del rol VENDEDOR
 * ════════════════════════════════════════════════════════════════
 *
 * Flujo de trabajo:
 *   1. Buscar el medicamento por nombre o código de barras.
 *   2. Elegir la modalidad: caja completa o blísters sueltos.
 *   3. Agregar al carrito (el total se calcula solo).
 *   4. "Completar venta": el backend descuenta el stock con FEFO,
 *      abre cajas si hiciera falta y registra todo en el kardex.
 */
export function PuntoVenta() {
  const [productos, setProductos] = useState<ProductoConStock[] | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [modalidad, setModalidad] = useState<UnidadEmpaque>(UnidadEmpaque.CAJA);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<ResultadoVenta | null>(null);
  const campoBusqueda = useRef<HTMLInputElement>(null);

  function cargarProductos() {
    api
      .get<ProductoConStock[]>('/productos')
      .then(setProductos)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    cargarProductos();
    campoBusqueda.current?.focus();
  }, []);

  // Filtrado por nombre o código de barras (la búsqueda rápida del mostrador)
  const resultados = useMemo(() => {
    if (!productos) return [];
    const texto = busqueda.trim().toLowerCase();
    const disponibles = productos.filter((p) => p.stock_blisters > 0);
    if (!texto) return disponibles.slice(0, 8);
    return disponibles
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(texto) ||
          (p.codigo ?? '').toLowerCase().includes(texto),
      )
      .slice(0, 8);
  }, [productos, busqueda]);

  const total = carrito.reduce((suma, linea) => suma + linea.precioUnitario * linea.cantidad, 0);

  /** Agrega un producto al carrito con la modalidad seleccionada. */
  function agregar(producto: ProductoConStock) {
    setError(null);
    const precioUnitario =
      modalidad === UnidadEmpaque.CAJA
        ? Number(producto.precio_caja)
        : Number(producto.precio_blister);

    if (precioUnitario <= 0) {
      setError(
        `"${producto.nombre}" no tiene precio configurado para la venta por ` +
          `${modalidad === UnidadEmpaque.CAJA ? 'caja' : 'blíster'}.`,
      );
      return;
    }
    // Vender por caja exige que existan cajas cerradas en stock.
    if (modalidad === UnidadEmpaque.CAJA && producto.cajas_disponibles === 0) {
      setError(`"${producto.nombre}" no tiene cajas cerradas disponibles.`);
      return;
    }

    setCarrito((actual) => {
      // Si el producto ya está en el carrito con la misma modalidad, se suma.
      const indice = actual.findIndex(
        (linea) => linea.producto.id === producto.id && linea.modalidad === modalidad,
      );
      if (indice >= 0) {
        const copia = [...actual];
        copia[indice] = { ...copia[indice], cantidad: copia[indice].cantidad + 1 };
        return copia;
      }
      return [...actual, { producto, modalidad, cantidad: 1, precioUnitario }];
    });
    setBusqueda('');
    campoBusqueda.current?.focus();
  }

  function cambiarCantidad(indice: number, cantidad: number) {
    if (cantidad < 1) return;
    setCarrito((actual) =>
      actual.map((linea, i) => (i === indice ? { ...linea, cantidad } : linea)),
    );
  }

  function quitar(indice: number) {
    setCarrito((actual) => actual.filter((_, i) => i !== indice));
  }

  /** Envía la venta al backend: ahí ocurre el descuento FEFO automático. */
  async function completarVenta() {
    if (carrito.length === 0) return;
    setProcesando(true);
    setError(null);
    try {
      const resultado = await api.post<ResultadoVenta>('/ventas', {
        lineas: carrito.map((linea) => ({
          productoId: linea.producto.id,
          modalidad: linea.modalidad,
          cantidad: linea.cantidad,
        })),
      });
      setComprobante(resultado);
      setCarrito([]);
      cargarProductos(); // refrescar el stock en pantalla
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  if (!productos) return <Cargando mensaje="Cargando catálogo…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
        <p className="text-sm text-gray-500">
          Busque el medicamento, elija caja o blíster y complete la venta
        </p>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ══════════ COLUMNA IZQUIERDA: búsqueda y catálogo ══════════ */}
        <div className="space-y-4 lg:col-span-3">
          {/* Selector de modalidad de venta */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Modalidad de venta
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModalidad(UnidadEmpaque.CAJA)}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition ${
                  modalidad === UnidadEmpaque.CAJA
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Package className="h-5 w-5" /> Por caja
              </button>
              <button
                onClick={() => setModalidad(UnidadEmpaque.BLISTER)}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition ${
                  modalidad === UnidadEmpaque.BLISTER
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <PackageOpen className="h-5 w-5" /> Por blíster
              </button>
            </div>
            {modalidad === UnidadEmpaque.BLISTER && (
              <p className="mt-2 text-xs text-blue-600">
                Si no hay blísters sueltos, el sistema abrirá una caja automáticamente.
              </p>
            )}
          </div>

          {/* Buscador rápido */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                ref={campoBusqueda}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o código de barras…"
                className="w-full text-sm outline-none placeholder:text-gray-400"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Resultados de la búsqueda */}
            <ul className="divide-y divide-gray-50">
              {resultados.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  {busqueda
                    ? 'No se encontraron medicamentos con stock disponible.'
                    : 'No hay productos con stock.'}
                </li>
              )}
              {resultados.map((producto) => {
                const precio =
                  modalidad === UnidadEmpaque.CAJA
                    ? Number(producto.precio_caja)
                    : Number(producto.precio_blister);
                const sinCajas =
                  modalidad === UnidadEmpaque.CAJA && producto.cajas_disponibles === 0;

                return (
                  <li
                    key={producto.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {producto.nombre}
                        {producto.requiere_receta && (
                          <span className="ml-2 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                            RECETA
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {producto.codigo ?? 'sin código'} ·{' '}
                        {formatearStock(producto.stock_blisters, producto.unidades_por_caja)}
                        {producto.estado_stock === EstadoSemaforo.ROJO && (
                          <span className="ml-1 font-medium text-red-600">· stock crítico</span>
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatearSoles(precio)}
                      </span>
                      <button
                        onClick={() => agregar(producto)}
                        disabled={sinCajas}
                        title={sinCajas ? 'Sin cajas cerradas disponibles' : 'Agregar'}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ══════════ COLUMNA DERECHA: carrito ══════════ */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-900">Venta actual</h2>
              {carrito.length > 0 && (
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {carrito.length} ítem(s)
                </span>
              )}
            </div>

            {carrito.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400">
                El carrito está vacío.
                <br />
                Busque un medicamento y agréguelo.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {carrito.map((linea, indice) => (
                  <li key={`${linea.producto.id}-${linea.modalidad}`} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {linea.producto.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {linea.modalidad === UnidadEmpaque.CAJA ? 'Caja' : 'Blíster'} ·{' '}
                          {formatearSoles(linea.precioUnitario)} c/u
                        </p>
                      </div>
                      <button
                        onClick={() => quitar(indice)}
                        className="rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <input
                        type="number"
                        min="1"
                        value={linea.cantidad}
                        onChange={(e) => cambiarCantidad(indice, Number(e.target.value))}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {formatearSoles(linea.precioUnitario * linea.cantidad)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Total y botón de cierre */}
            <div className="space-y-3 border-t border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total a pagar</span>
                <span className="text-2xl font-bold text-gray-900">{formatearSoles(total)}</span>
              </div>
              <button
                onClick={completarVenta}
                disabled={carrito.length === 0 || procesando}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="h-5 w-5" />
                {procesando ? 'Procesando…' : 'Completar venta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ COMPROBANTE: evidencia del descuento FEFO ══════════ */}
      {comprobante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-6 w-6" />
              </span>
              <h2 className="mt-3 text-lg font-bold text-gray-900">¡Venta registrada!</h2>
              <p className="text-sm text-gray-500">
                Comprobante {comprobante.numeroComprobante} ·{' '}
                {new Date(comprobante.fecha).toLocaleString('es-PE', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {formatearSoles(comprobante.totalSoles)}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Detalle del despacho (FEFO)
              </p>
              {comprobante.lineas.map((linea) => (
                <div key={linea.productoId} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">
                    {linea.cantidad} ×{' '}
                    {linea.modalidad === UnidadEmpaque.CAJA ? 'caja' : 'blíster'} de{' '}
                    {linea.productoNombre}
                    <span className="float-right">{formatearSoles(linea.subtotal)}</span>
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-gray-600">
                    {linea.despacho.map((tramo) => (
                      <li key={tramo.loteId}>
                        • Lote <strong>{tramo.numeroLote}</strong> (vence{' '}
                        {formatearFecha(tramo.fechaVencimiento)}): −{tramo.blistersTomados}{' '}
                        blíster(es)
                        {tramo.cajasAbiertas > 0 && (
                          <span className="ml-1 font-medium text-blue-600">
                            · se abrió {tramo.cajasAbiertas} caja(s)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setComprobante(null);
                campoBusqueda.current?.focus();
              }}
              className="mt-6 w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Nueva venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
