import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Package, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import {
  EstadoSemaforo,
  formatearFecha,
  formatearSoles,
  formatearStock,
  type Categoria,
  type ProductoConStock,
} from '@botica/comun';
import { api } from '../lib/api';
import { EtiquetaEstado } from '../componentes/ui/EtiquetaEstado';
import { Cargando } from '../componentes/ui/Cargando';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { esAdmin, puedeGestionarInventario } from '../lib/permisos';

/** Estado del formulario del modal (crear o editar producto). */
interface FormularioProducto {
  id?: string;
  codigo: string;
  nombre: string;
  categoriaId: string;
  presentacion: string;
  laboratorio: string;
  unidadesPorCaja: string;
  precioCaja: string;
  precioBlister: string;
  stockMinimo: string;
  requiereReceta: boolean;
}

const FORMULARIO_VACIO: FormularioProducto = {
  codigo: '',
  nombre: '',
  categoriaId: '',
  presentacion: '',
  laboratorio: '',
  unidadesPorCaja: '10',
  precioCaja: '0',
  precioBlister: '0',
  stockMinimo: '10',
  requiereReceta: false,
};

/** Texto del semáforo de vencimiento según los días restantes. */
function textoVencimiento(producto: ProductoConStock): string {
  if (producto.blisters_vencidos > 0) return `${producto.blisters_vencidos} vencido(s)`;
  if (producto.dias_para_vencer === null) return 'Sin lotes';
  if (producto.estado_vencimiento === EstadoSemaforo.AMARILLO) {
    return `Vence en ${producto.dias_para_vencer} días`;
  }
  return 'En orden';
}

/**
 * Pantalla "Productos y Categorías".
 *
 * El ESTADO DE STOCK que se muestra aquí lo calcula PostgreSQL con la regla
 * del proyecto (ver vista_stock_productos en supabase/esquema.sql):
 *    Normal   -> stock > stock_minimo
 *    Atención -> stock <= stock_minimo (pero mayor que la mitad)
 *    Crítico  -> stock = 0  o  stock <= stock_minimo / 2
 */
export function Productos() {
  const { perfil } = useAutenticacion();
  const puedeEditar = puedeGestionarInventario(perfil);
  const administrador = esAdmin(perfil);

  const [productos, setProductos] = useState<ProductoConStock[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [formulario, setFormulario] = useState<FormularioProducto | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  const cargar = useCallback(() => {
    setError(null);
    Promise.all([
      api.get<ProductoConStock[]>('/productos'),
      api.get<Categoria[]>('/categorias'),
    ])
      .then(([listaProductos, listaCategorias]) => {
        setProductos(listaProductos);
        setCategorias(listaCategorias);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(cargar, [cargar]);

  async function guardarProducto(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setGuardando(true);
    setError(null);

    const cuerpo = {
      codigo: formulario.codigo || undefined,
      nombre: formulario.nombre,
      categoriaId: formulario.categoriaId || undefined,
      presentacion: formulario.presentacion || undefined,
      laboratorio: formulario.laboratorio || undefined,
      unidadesPorCaja: Number(formulario.unidadesPorCaja),
      precioCaja: Number(formulario.precioCaja),
      precioBlister: Number(formulario.precioBlister),
      stockMinimo: Number(formulario.stockMinimo),
      requiereReceta: formulario.requiereReceta,
    };

    try {
      if (formulario.id) await api.patch(`/productos/${formulario.id}`, cuerpo);
      else await api.post('/productos', cuerpo);
      setFormulario(null);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function desactivarProducto(producto: ProductoConStock) {
    if (
      !confirm(
        `¿Desactivar "${producto.nombre}"?\n\nEs una baja lógica: se conserva el ` +
          'historial y un administrador puede reactivarlo desde el Kardex.',
      )
    )
      return;
    try {
      const respuesta = await api.delete<{ mensaje: string }>(`/productos/${producto.id}`);
      setMensaje(respuesta.mensaje);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function crearCategoria(evento: FormEvent) {
    evento.preventDefault();
    if (!nuevaCategoria.trim()) return;
    try {
      await api.post('/categorias', { nombre: nuevaCategoria.trim() });
      setNuevaCategoria('');
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /** Eliminar categoría: operación exclusiva del ADMIN. */
  async function eliminarCategoria(categoria: Categoria) {
    if (
      !confirm(
        `¿Eliminar la categoría "${categoria.nombre}"?\n\n` +
          'Los productos que la usaban quedarán sin categoría (no se borran).',
      )
    )
      return;
    try {
      const respuesta = await api.delete<{ mensaje: string }>(`/categorias/${categoria.id}`);
      setMensaje(respuesta.mensaje);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos y Categorías</h1>
          <p className="text-sm text-gray-500">
            Catálogo con stock consolidado por lotes y estado calculado automáticamente
          </p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setFormulario(FORMULARIO_VACIO)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Nuevo producto
          </button>
        )}
      </div>

      {mensaje && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* ══════ Categorías ══════ */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="mr-2 text-sm font-medium text-gray-700">Categorías:</span>

          {categorias.length === 0 && (
            <span className="text-sm text-gray-400">aún no hay categorías</span>
          )}
          {categorias.map((categoria) => (
            <span
              key={categoria.id}
              className="group flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
            >
              {categoria.nombre}
              {/* Eliminar categoría: solo el ADMIN */}
              {administrador && (
                <button
                  onClick={() => eliminarCategoria(categoria)}
                  title="Eliminar categoría"
                  className="ml-0.5 rounded-full p-0.5 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}

          {puedeEditar && (
            <form onSubmit={crearCategoria} className="ml-auto flex items-center gap-2">
              <input
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                placeholder="Nueva categoría…"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
              >
                Agregar
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ══════ Tabla del catálogo ══════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {!productos ? (
          <Cargando mensaje="Cargando catálogo…" />
        ) : productos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No hay productos registrados.{' '}
            {puedeEditar && 'Cree el primero con "Nuevo producto".'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3 text-right">Precios (S/)</th>
                  <th className="px-5 py-3">Stock actual</th>
                  <th className="px-5 py-3">Estado de stock</th>
                  <th className="px-5 py-3">Vencimiento</th>
                  {puedeEditar && <th className="px-5 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productos.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">
                        {producto.nombre}
                        {producto.requiere_receta && (
                          <span className="ml-2 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                            RECETA
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {producto.codigo ?? 'sin código'}
                        {producto.presentacion ? ` · ${producto.presentacion}` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {producto.categoria_nombre ?? 'Sin categoría'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      <p className="whitespace-nowrap">
                        Caja: {formatearSoles(producto.precio_caja)}
                      </p>
                      {producto.unidades_por_caja > 1 && (
                        <p className="whitespace-nowrap text-xs text-gray-400">
                          Blíster: {formatearSoles(producto.precio_blister)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">
                        {formatearStock(producto.stock_blisters, producto.unidades_por_caja)}
                      </p>
                      <p className="text-xs text-gray-400">
                        mínimo: {producto.stock_minimo} blíster(es)
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <EtiquetaEstado estado={producto.estado_stock} />
                    </td>
                    <td className="px-5 py-3">
                      <EtiquetaEstado
                        estado={producto.estado_vencimiento}
                        texto={textoVencimiento(producto)}
                      />
                      {producto.proxima_fecha_vencimiento && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatearFecha(producto.proxima_fecha_vencimiento)}
                        </p>
                      )}
                    </td>
                    {puedeEditar && (
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            title="Editar"
                            onClick={() =>
                              setFormulario({
                                id: producto.id,
                                codigo: producto.codigo ?? '',
                                nombre: producto.nombre,
                                categoriaId: producto.categoria_id ?? '',
                                presentacion: producto.presentacion ?? '',
                                laboratorio: producto.laboratorio ?? '',
                                unidadesPorCaja: String(producto.unidades_por_caja),
                                precioCaja: String(producto.precio_caja),
                                precioBlister: String(producto.precio_blister),
                                stockMinimo: String(producto.stock_minimo),
                                requiereReceta: producto.requiere_receta,
                              })
                            }
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Desactivar"
                            onClick={() => desactivarProducto(producto)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════ Modal de crear / editar producto ══════ */}
      {formulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {formulario.id ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button
                onClick={() => setFormulario(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardarProducto} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Nombre *</label>
                <input
                  required
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                  placeholder="Paracetamol 500 mg"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Código / código de barras
                </label>
                <input
                  value={formulario.codigo}
                  onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value })}
                  placeholder="PAR-500"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Categoría</label>
                <select
                  value={formulario.categoriaId}
                  onChange={(e) => setFormulario({ ...formulario, categoriaId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Presentación</label>
                <input
                  value={formulario.presentacion}
                  onChange={(e) => setFormulario({ ...formulario, presentacion: e.target.value })}
                  placeholder="Caja x 10 blísters de 10 tabletas"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Laboratorio</label>
                <input
                  value={formulario.laboratorio}
                  onChange={(e) => setFormulario({ ...formulario, laboratorio: e.target.value })}
                  placeholder="Genfar"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {/* Bloque de empaque: el corazón de la venta por caja/blíster */}
              <div className="col-span-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Package className="h-4 w-4 text-emerald-600" />
                  Empaque y precios
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Blísters por caja *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formulario.unidadesPorCaja}
                      onChange={(e) =>
                        setFormulario({ ...formulario, unidadesPorCaja: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
                      Use 1 si se vende por unidad (frascos, geles)
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Precio por caja (S/) *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formulario.precioCaja}
                      onChange={(e) =>
                        setFormulario({ ...formulario, precioCaja: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Precio por blíster (S/) *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formulario.precioBlister}
                      onChange={(e) =>
                        setFormulario({ ...formulario, precioBlister: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Stock mínimo (en blísters) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formulario.stockMinimo}
                  onChange={(e) => setFormulario({ ...formulario, stockMinimo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Debajo de este valor el estado pasa a Atención; bajo la mitad, a Crítico
                </p>
              </div>

              <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formulario.requiereReceta}
                  onChange={(e) =>
                    setFormulario({ ...formulario, requiereReceta: e.target.checked })
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
                Requiere receta médica
              </label>

              <div className="col-span-2 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormulario(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {guardando ? 'Guardando…' : formulario.id ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
