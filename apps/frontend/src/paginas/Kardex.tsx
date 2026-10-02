import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import {
  TipoMovimientoKardex,
  UnidadEmpaque,
  formatearSoles,
  type MovimientoDetallado,
  type ProductoConStock,
  type RespuestaPaginada,
} from '@botica/comun';
import { api } from '../lib/api';
import { Cargando } from '../componentes/ui/Cargando';
import { Paginacion } from '../componentes/ui/Paginacion';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { esAdmin } from '../lib/permisos';

/** Apariencia de cada tipo de movimiento en la tabla. */
const ESTILO_TIPO: Record<TipoMovimientoKardex, { etiqueta: string; clases: string }> = {
  [TipoMovimientoKardex.ENTRADA_MANUAL]: {
    etiqueta: 'Entrada manual',
    clases: 'bg-emerald-50 text-emerald-700',
  },
  [TipoMovimientoKardex.SALIDA_VENTA]: {
    etiqueta: 'Salida por venta',
    clases: 'bg-blue-50 text-blue-700',
  },
  [TipoMovimientoKardex.SALIDA_MERMA]: {
    etiqueta: 'Salida por merma',
    clases: 'bg-red-50 text-red-700',
  },
  [TipoMovimientoKardex.AJUSTE_ADMIN]: {
    etiqueta: 'Ajuste admin.',
    clases: 'bg-purple-50 text-purple-700',
  },
};

/** Las entradas suman existencias; el resto las resta. */
function esEntrada(tipo: TipoMovimientoKardex): boolean {
  return tipo === TipoMovimientoKardex.ENTRADA_MANUAL;
}

/**
 * Pantalla del KARDEX (historial de existencias).
 *
 * Incluye dos funciones exclusivas del ADMIN, tal como pide el proyecto:
 *   - REACTIVAR un producto desactivado.
 *   - CORREGIR un registro del historial por error administrativo.
 */
export function Kardex() {
  const { perfil } = useAutenticacion();
  const administrador = esAdmin(perfil);

  const [movimientos, setMovimientos] = useState<RespuestaPaginada<MovimientoDetallado> | null>(
    null,
  );
  const [inactivos, setInactivos] = useState<ProductoConStock[]>([]);
  const [pagina, setPagina] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Estado del modal de corrección (solo ADMIN)
  const [corrigiendo, setCorrigiendo] = useState<MovimientoDetallado | null>(null);
  const [formCorreccion, setFormCorreccion] = useState({ cantidad: '', valorSoles: '', motivo: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    const parametros = new URLSearchParams({ pagina: String(pagina), porPagina: '10' });
    if (filtroTipo) parametros.set('tipo', filtroTipo);
    if (desde) parametros.set('desde', desde);
    if (hasta) parametros.set('hasta', hasta);

    api
      .get<RespuestaPaginada<MovimientoDetallado>>(`/kardex?${parametros}`)
      .then(setMovimientos)
      .catch((e: Error) => setError(e.message));
  }, [pagina, filtroTipo, desde, hasta]);

  const cargarInactivos = useCallback(() => {
    api
      .get<ProductoConStock[]>('/productos/inactivos')
      .then(setInactivos)
      .catch(() => setInactivos([]));
  }, []);

  useEffect(cargar, [cargar]);
  useEffect(cargarInactivos, [cargarInactivos]);

  /** Devuelve un producto desactivado al catálogo (solo ADMIN). */
  async function reactivar(producto: ProductoConStock) {
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await api.patch<{ mensaje: string }>(
        `/productos/${producto.id}/reactivar`,
      );
      setMensaje(respuesta.mensaje);
      cargarInactivos();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function abrirCorreccion(movimiento: MovimientoDetallado) {
    setCorrigiendo(movimiento);
    setFormCorreccion({
      cantidad: String(movimiento.cantidad),
      valorSoles: String(movimiento.valor_soles),
      motivo: '',
    });
  }

  async function guardarCorreccion(evento: FormEvent) {
    evento.preventDefault();
    if (!corrigiendo) return;
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/kardex/${corrigiendo.id}`, {
        cantidad: Number(formCorreccion.cantidad),
        valorSoles: Number(formCorreccion.valorSoles),
        motivo: formCorreccion.motivo,
      });
      setCorrigiendo(null);
      setMensaje('Registro corregido correctamente.');
      cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kardex</h1>
        <p className="text-sm text-gray-500">
          Historial completo de entradas y salidas de la botica
        </p>
      </div>

      {mensaje && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* ══════ Productos desactivados: reactivación (solo ADMIN) ══════ */}
      {administrador && inactivos.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-900">
              Productos desactivados ({inactivos.length})
            </h2>
          </div>
          <p className="mb-3 text-xs text-amber-700">
            Como administrador, puede devolverlos al catálogo y al punto de venta.
          </p>
          <ul className="space-y-2">
            {inactivos.map((producto) => (
              <li
                key={producto.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{producto.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {producto.codigo ?? 'sin código'} · {producto.stock_blisters} blíster(es) en stock
                  </p>
                </div>
                <button
                  onClick={() => reactivar(producto)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reactivar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ══════ Filtros ══════ */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              setPagina(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Todos</option>
            <option value={TipoMovimientoKardex.ENTRADA_MANUAL}>Entradas manuales</option>
            <option value={TipoMovimientoKardex.SALIDA_VENTA}>Salidas por venta</option>
            <option value={TipoMovimientoKardex.SALIDA_MERMA}>Salidas por merma</option>
            <option value={TipoMovimientoKardex.AJUSTE_ADMIN}>Ajustes administrativos</option>
          </select>
        </div>
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
        {(filtroTipo || desde || hasta) && (
          <button
            onClick={() => {
              setFiltroTipo('');
              setDesde('');
              setHasta('');
              setPagina(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ══════ Tabla de movimientos ══════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {!movimientos ? (
          <Cargando mensaje="Cargando historial…" />
        ) : movimientos.datos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No hay movimientos con los filtros seleccionados.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Fecha y hora</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3 text-center">Cantidad</th>
                    <th className="px-5 py-3">Lote</th>
                    <th className="px-5 py-3 text-right">Valor</th>
                    <th className="px-5 py-3">Responsable</th>
                    {administrador && <th className="px-5 py-3 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movimientos.datos.map((movimiento) => {
                    const estilo = ESTILO_TIPO[movimiento.tipo];
                    const entrada = esEntrada(movimiento.tipo);
                    return (
                      <tr key={movimiento.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                          {new Date(movimiento.creado_en).toLocaleString('es-PE', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${estilo.clases}`}
                          >
                            {entrada ? (
                              <ArrowDownToLine className="h-3 w-3" />
                            ) : (
                              <ArrowUpFromLine className="h-3 w-3" />
                            )}
                            {estilo.etiqueta}
                          </span>
                          {movimiento.editado && (
                            <span
                              title="Registro corregido por un administrador"
                              className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500"
                            >
                              EDITADO
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">
                            {movimiento.producto?.nombre ?? '—'}
                          </p>
                          {movimiento.producto?.activo === false && (
                            <span className="text-xs text-amber-600">producto desactivado</span>
                          )}
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
                        <td className="px-5 py-3 text-right text-gray-700">
                          {formatearSoles(movimiento.valor_soles)}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {movimiento.usuario?.nombre_completo ?? 'Sistema'}
                          {movimiento.proveedor && (
                            <p className="text-xs text-gray-400">
                              Prov.: {movimiento.proveedor.nombre}
                            </p>
                          )}
                        </td>
                        {administrador && (
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => abrirCorreccion(movimiento)}
                              title="Corregir este registro"
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-purple-50 hover:text-purple-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Paginacion
              pagina={movimientos.pagina}
              totalPaginas={movimientos.totalPaginas}
              total={movimientos.total}
              porPagina={movimientos.porPagina}
              onCambiar={setPagina}
            />
          </>
        )}
      </div>

      {/* ══════ Modal de corrección (solo ADMIN) ══════ */}
      {corrigiendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Corregir registro</h2>
              <button
                onClick={() => setCorrigiendo(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-700">
              Esta acción corrige el registro histórico, no el stock actual de los lotes.
              El movimiento quedará marcado como editado.
            </p>

            <form onSubmit={guardarCorreccion} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Cantidad ({corrigiendo.unidad === UnidadEmpaque.CAJA ? 'cajas' : 'blísters'})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formCorreccion.cantidad}
                  onChange={(e) =>
                    setFormCorreccion({ ...formCorreccion, cantidad: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Valor en soles
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formCorreccion.valorSoles}
                  onChange={(e) =>
                    setFormCorreccion({ ...formCorreccion, valorSoles: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Motivo de la corrección *
                </label>
                <input
                  required
                  value={formCorreccion.motivo}
                  onChange={(e) =>
                    setFormCorreccion({ ...formCorreccion, motivo: e.target.value })
                  }
                  placeholder="Ej. Se digitó 10 en lugar de 1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrigiendo(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {guardando ? 'Guardando…' : 'Guardar corrección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
