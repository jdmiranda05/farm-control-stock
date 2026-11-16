import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArchiveRestore,
  Check,
  EyeOff,
  Lock,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tag,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  EstadoSemaforo,
  diasParaVencer,
  formatearFecha,
  formatearSoles,
  formatearStock,
  nombreUnidadMinima,
  tieneBlisters,
  validarEmpaque,
  type Categoria,
  type ProductoConStock,
  type RespuestaPaginada,
} from '@botica/comun';
import { api } from '../lib/api';
import { Selector } from '../componentes/ui/Selector';
import { EtiquetaEstado } from '../componentes/ui/EtiquetaEstado';
import { EsqueletoProductos, EsqueletoTabla } from '../componentes/ui/Esqueleto';
import { Paginacion } from '../componentes/ui/Paginacion';
import { useConfirmacion } from '../componentes/ui/DialogoConfirmacion';
import { ControlSegmentado } from '../componentes/ui/ControlSegmentado';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { puedeCrearEnCatalogo, puedeEditarCatalogo } from '../lib/permisos';

/** Estado del formulario del modal (crear o editar producto). */
interface FormularioProducto {
  id?: string;
  codigo: string;
  nombre: string;
  categoriaId: string;
  presentacion: string;
  laboratorio: string;
  tieneBlisters: boolean;
  unidadesPorCaja: string;
  precioCaja: string;
  precioBlister: string;
  stockMinimo: string;
  requiereReceta: boolean;
  /** Al editar: el producto tiene mercadería, no se puede cambiar el empaque. */
  empaqueBloqueado?: boolean;
}

const FORMULARIO_VACIO: FormularioProducto = {
  codigo: '',
  nombre: '',
  categoriaId: '',
  presentacion: '',
  laboratorio: '',
  tieneBlisters: true,
  unidadesPorCaja: '10',
  precioCaja: '',
  precioBlister: '',
  stockMinimo: '10',
  requiereReceta: false,
};

/** Texto del semáforo de vencimiento según los días restantes. */
function textoVencimiento(producto: ProductoConStock): string {
  if (producto.blisters_vencidos > 0) {
    return `${producto.blisters_vencidos} ${nombreUnidadMinima(producto)} ${
      tieneBlisters(producto) ? 'vencidos' : 'vencidas'
    }`;
  }
  if (!producto.proxima_fecha_vencimiento) return 'Sin lotes';
  if (producto.estado_vencimiento === EstadoSemaforo.AMARILLO) {
    // Días con la fecha LOCAL (la vista de la base de datos usa la fecha UTC)
    const dias = diasParaVencer(producto.proxima_fecha_vencimiento);
    return dias <= 0 ? 'Vence hoy' : `Vence en ${dias} día${dias === 1 ? '' : 's'}`;
  }
  return 'En orden';
}

/** Valida el formulario completo y devuelve la lista de errores. */
function validarFormulario(f: FormularioProducto): string[] {
  const errores: string[] = [];
  if (!f.nombre.trim()) errores.push('El nombre del producto es obligatorio');
  if (f.nombre.trim().length > 120) errores.push('El nombre no puede superar 120 caracteres');

  const stockMinimo = Number(f.stockMinimo);
  if (f.stockMinimo === '' || !Number.isInteger(stockMinimo) || stockMinimo < 0) {
    errores.push('El stock mínimo debe ser un número entero mayor o igual a 0');
  }

  errores.push(
    ...validarEmpaque({
      tieneBlisters: f.tieneBlisters,
      unidadesPorCaja: f.tieneBlisters ? Number(f.unidadesPorCaja) : 1,
      precioCaja: f.precioCaja === '' ? NaN : Number(f.precioCaja),
      precioBlister: f.precioBlister === '' ? NaN : Number(f.precioBlister),
    }),
  );
  return errores;
}

/**
 * Pantalla "Productos y Categorías".
 *
 * Permisos:
 *   - VENDEDOR   -> solo consulta.
 *   - ALMACENERO -> consulta y registra productos/categorías nuevos.
 *   - ADMIN      -> además EDITA, DESHABILITA y ELIMINA (funciones administrativas).
 *
 * El ESTADO DE STOCK lo calcula PostgreSQL (vista_stock_productos):
 *    Normal   -> stock > stock_minimo
 *    Atención -> stock <= stock_minimo (pero mayor que la mitad)
 *    Crítico  -> stock = 0  o  stock <= stock_minimo / 2
 */
export function Productos() {
  const { perfil } = useAutenticacion();
  const puedeCrear = puedeCrearEnCatalogo(perfil);
  const puedeEditar = puedeEditarCatalogo(perfil);

  // Catálogo paginado en el servidor: máximo 30 productos por página
  const [resultado, setResultado] = useState<RespuestaPaginada<ProductoConStock> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [cargandoPagina, setCargandoPagina] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [recarga, setRecarga] = useState(0);
  const inicioTabla = useRef<HTMLDivElement>(null);
  const productos = resultado?.datos ?? null;

  const [formulario, setFormulario] = useState<FormularioProducto | null>(null);
  const [erroresFormulario, setErroresFormulario] = useState<string[]>([]);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [editandoCategoria, setEditandoCategoria] = useState<{ id: string; nombre: string } | null>(
    null,
  );

  // Vista del ADMIN: catálogo activo o elementos deshabilitados (para reactivarlos)
  const [vista, setVista] = useState<'activos' | 'deshabilitados'>('activos');
  const [inactivos, setInactivos] = useState<ProductoConStock[]>([]);
  const { confirmar, dialogo } = useConfirmacion();

  /** Vuelve a pedir la página actual, las categorías y los deshabilitados. */
  const cargar = useCallback(() => setRecarga((n) => n + 1), []);

  // Categorías y productos deshabilitados (no dependen de la página)
  useEffect(() => {
    Promise.all([
      api.get<Categoria[]>(`/categorias${puedeEditar ? '?incluirInactivas=true' : ''}`),
      puedeEditar
        ? api.get<ProductoConStock[]>('/productos/inactivos')
        : Promise.resolve([] as ProductoConStock[]),
    ])
      .then(([listaCategorias, listaInactivos]) => {
        setCategorias(listaCategorias);
        setInactivos(listaInactivos);
      })
      .catch((e: Error) => setError(e.message));
  }, [puedeEditar, recarga]);

  // La búsqueda se aplica 300 ms después de dejar de escribir y vuelve a la página 1
  useEffect(() => {
    const t = setTimeout(() => {
      const texto = busqueda.trim();
      setBusquedaAplicada((anterior) => {
        if (anterior !== texto) {
          setPagina(1);
          setCargandoPagina(true);
        }
        return texto;
      });
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Página del catálogo (búsqueda y categoría las filtra el servidor)
  useEffect(() => {
    let cancelado = false;
    const parametros = new URLSearchParams({ pagina: String(pagina), porPagina: '30' });
    if (busquedaAplicada) parametros.set('busqueda', busquedaAplicada);
    if (categoriaFiltro) parametros.set('categoriaId', categoriaFiltro);
    api
      .get<RespuestaPaginada<ProductoConStock>>(`/productos/paginado?${parametros}`)
      .then((respuesta) => {
        if (cancelado) return;
        // Si la página quedó vacía (p. ej. tras deshabilitar el último), ir a la anterior
        if (respuesta.datos.length === 0 && pagina > 1 && respuesta.total > 0) {
          setPagina(respuesta.totalPaginas);
          return;
        }
        setResultado(respuesta);
      })
      .catch((e: Error) => {
        if (cancelado) return;
        setError(e.message);
        setResultado(
          (actual) => actual ?? { datos: [], total: 0, pagina: 1, porPagina: 30, totalPaginas: 1 },
        );
      })
      .finally(() => {
        if (!cancelado) setCargandoPagina(false);
      });
    return () => {
      cancelado = true;
    };
  }, [pagina, busquedaAplicada, categoriaFiltro, recarga]);

  function irAPagina(nueva: number) {
    setCargandoPagina(true);
    setPagina(nueva);
    inicioTabla.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function filtrarPorCategoria(id: string) {
    setCargandoPagina(true);
    setCategoriaFiltro((actual) => (actual === id ? '' : id));
    setPagina(1);
  }

  const categoriasActivas = categorias.filter((c) => c.activa !== false);
  const categoriasInactivas = categorias.filter((c) => c.activa === false);

  // Mensajes de éxito: se ocultan solos
  useEffect(() => {
    if (!mensaje) return;
    const temporizador = setTimeout(() => setMensaje(null), 5000);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  // Validación en vivo una vez que el usuario intentó guardar
  useEffect(() => {
    if (formulario && intentoGuardar) setErroresFormulario(validarFormulario(formulario));
  }, [formulario, intentoGuardar]);

  const filtrados = productos ?? [];
  const total = resultado?.total ?? 0;
  const hayFiltros = !!busquedaAplicada || !!categoriaFiltro;

  function abrirNuevo() {
    setError(null);
    setIntentoGuardar(false);
    setErroresFormulario([]);
    setFormulario(FORMULARIO_VACIO);
  }

  function abrirEdicion(producto: ProductoConStock) {
    setError(null);
    setIntentoGuardar(false);
    setErroresFormulario([]);
    const conBlisters = tieneBlisters(producto);
    setFormulario({
      id: producto.id,
      codigo: producto.codigo ?? '',
      nombre: producto.nombre,
      categoriaId: producto.categoria_id ?? '',
      presentacion: producto.presentacion ?? '',
      laboratorio: producto.laboratorio ?? '',
      tieneBlisters: conBlisters,
      unidadesPorCaja: String(producto.unidades_por_caja),
      precioCaja: String(producto.precio_caja),
      precioBlister: conBlisters ? String(producto.precio_blister) : '',
      stockMinimo: String(producto.stock_minimo),
      requiereReceta: producto.requiere_receta,
      empaqueBloqueado: producto.stock_blisters + producto.blisters_vencidos > 0,
    });
  }

  function cerrarFormulario() {
    setFormulario(null);
    setErroresFormulario([]);
    setIntentoGuardar(false);
  }

  async function guardarProducto(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setIntentoGuardar(true);

    const errores = validarFormulario(formulario);
    setErroresFormulario(errores);
    if (errores.length > 0) return;

    setGuardando(true);
    const cuerpo = {
      codigo: formulario.codigo.trim() || undefined,
      nombre: formulario.nombre.trim(),
      categoriaId: formulario.categoriaId || undefined,
      presentacion: formulario.presentacion.trim() || undefined,
      laboratorio: formulario.laboratorio.trim() || undefined,
      tieneBlisters: formulario.tieneBlisters,
      unidadesPorCaja: formulario.tieneBlisters ? Number(formulario.unidadesPorCaja) : 1,
      precioCaja: Number(formulario.precioCaja),
      precioBlister: formulario.tieneBlisters
        ? Number(formulario.precioBlister)
        : Number(formulario.precioCaja),
      stockMinimo: Number(formulario.stockMinimo),
      requiereReceta: formulario.requiereReceta,
    };

    try {
      if (formulario.id) {
        await api.patch(`/productos/${formulario.id}`, cuerpo);
        setMensaje(`Producto "${cuerpo.nombre}" actualizado correctamente.`);
      } else {
        await api.post('/productos', cuerpo);
        setMensaje(`Producto "${cuerpo.nombre}" registrado correctamente.`);
      }
      cerrarFormulario();
      cargar();
    } catch (e) {
      setErroresFormulario([(e as Error).message]);
    } finally {
      setGuardando(false);
    }
  }

  async function desactivarProducto(producto: ProductoConStock) {
    let respuesta = '';
    const confirmado = await confirmar({
      titulo: `¿Deshabilitar "${producto.nombre}"?`,
      mensaje:
        producto.stock_blisters > 0
          ? `Todavía tiene ${formatearStock(producto.stock_blisters, producto.unidades_por_caja)} en almacén. ` +
            'Dejará de venderse, pero conservará su historial y podrá reactivarlo cuando quiera.'
          : 'Dejará de mostrarse en el catálogo y en la caja. Su historial se conserva y podrá reactivarlo cuando quiera.',
      accion: 'Deshabilitar',
      tono: 'neutro',
      Icono: EyeOff,
      alConfirmar: async () => {
        respuesta = (await api.delete<{ mensaje: string }>(`/productos/${producto.id}`)).mensaje;
      },
    });
    if (!confirmado) return;
    setMensaje(respuesta);
    cargar();
  }

  async function reactivarProducto(producto: ProductoConStock) {
    let respuesta = '';
    const confirmado = await confirmar({
      titulo: `¿Reactivar "${producto.nombre}"?`,
      mensaje: 'Volverá al catálogo y podrá venderse y recibir mercadería otra vez.',
      accion: 'Reactivar',
      tono: 'exito',
      Icono: ArchiveRestore,
      alConfirmar: async () => {
        respuesta = (await api.patch<{ mensaje: string }>(`/productos/${producto.id}/reactivar`))
          .mensaje;
      },
    });
    if (!confirmado) return;
    setMensaje(respuesta);
    cargar();
  }

  async function crearCategoria(evento: FormEvent) {
    evento.preventDefault();
    const nombre = nuevaCategoria.trim();
    if (!nombre) {
      setError('Escriba el nombre de la categoría');
      return;
    }
    const repetida = categorias.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (repetida) {
      setError(
        repetida.activa === false
          ? `La categoría "${repetida.nombre}" existe pero está deshabilitada: reactívela en lugar de crearla de nuevo.`
          : `La categoría "${nombre}" ya existe`,
      );
      return;
    }
    try {
      await api.post('/categorias', { nombre });
      setNuevaCategoria('');
      setError(null);
      setMensaje(`Categoría "${nombre}" creada.`);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /** Renombrar categoría: operación exclusiva del ADMIN. */
  async function guardarCategoria(evento: FormEvent) {
    evento.preventDefault();
    if (!editandoCategoria) return;
    const nombre = editandoCategoria.nombre.trim();
    if (!nombre) {
      setError('El nombre de la categoría no puede quedar vacío');
      return;
    }
    if (
      categorias.some(
        (c) => c.id !== editandoCategoria.id && c.nombre.toLowerCase() === nombre.toLowerCase(),
      )
    ) {
      setError(`La categoría "${nombre}" ya existe`);
      return;
    }
    try {
      await api.patch(`/categorias/${editandoCategoria.id}`, { nombre });
      setEditandoCategoria(null);
      setError(null);
      setMensaje(`Categoría renombrada a "${nombre}".`);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /** Deshabilitar categoría (baja lógica): operación exclusiva del ADMIN. */
  async function desactivarCategoria(categoria: Categoria) {
    // Cuántos productos usan la categoría (lo cuenta el servidor sobre todo el catálogo)
    const usos = await api
      .get<RespuestaPaginada<ProductoConStock>>(
        `/productos/paginado?categoriaId=${categoria.id}&porPagina=1`,
      )
      .then((r) => r.total)
      .catch(() => 0);
    let respuesta = '';
    const confirmado = await confirmar({
      titulo: `¿Deshabilitar la categoría "${categoria.nombre}"?`,
      mensaje:
        usos > 0
          ? `${usos === 1 ? "El producto que la usa la conserva" : `Los ${usos} productos que la usan la conservan`}, pero no podrá elegirse para productos nuevos. Puede reactivarla cuando quiera.`
          : 'No podrá elegirse para productos nuevos. Puede reactivarla cuando quiera.',
      accion: 'Deshabilitar',
      tono: 'neutro',
      Icono: EyeOff,
      alConfirmar: async () => {
        respuesta = (await api.delete<{ mensaje: string }>(`/categorias/${categoria.id}`)).mensaje;
      },
    });
    if (!confirmado) return;
    setMensaje(respuesta);
    cargar();
  }

  async function reactivarCategoria(categoria: Categoria) {
    let respuesta = '';
    const confirmado = await confirmar({
      titulo: `¿Reactivar la categoría "${categoria.nombre}"?`,
      mensaje: 'Volverá a estar disponible al registrar y editar productos.',
      accion: 'Reactivar',
      tono: 'exito',
      Icono: ArchiveRestore,
      alConfirmar: async () => {
        respuesta = (
          await api.patch<{ mensaje: string }>(`/categorias/${categoria.id}/reactivar`)
        ).mensaje;
      },
    });
    if (!confirmado) return;
    setMensaje(respuesta);
    cargar();
  }

  if (!resultado) return <EsqueletoProductos />;

  // Ayudas en vivo del formulario de empaque
  const f = formulario;
  const unidades = f ? Number(f.unidadesPorCaja) : 0;
  const precioCaja = f ? Number(f.precioCaja) : 0;
  const precioBlister = f ? Number(f.precioBlister) : 0;
  const totalPorBlisters = unidades >= 2 && precioBlister > 0 ? precioBlister * unidades : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos y Categorías</h1>
          <p className="text-sm text-gray-500">
            {puedeEditar
              ? 'Gestión del catálogo: registrar, editar y deshabilitar productos'
              : 'Catálogo de consulta con stock por lotes. Los productos los registra el administrador'}
          </p>
        </div>
        {puedeCrear && (
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Nuevo producto
          </button>
        )}
      </div>

      {puedeEditar && (
        <ControlSegmentado
          etiquetaAccesible="Vista del catálogo"
          className="w-full max-w-sm"
          valor={vista}
          alCambiar={setVista}
          opciones={[
            { valor: 'activos', etiqueta: 'Activos' },
            {
              valor: 'deshabilitados',
              etiqueta: (
                <>
                  Deshabilitados
                  {inactivos.length + categoriasInactivas.length > 0 && (
                    <span className="rounded-full bg-gray-900/10 px-1.5 text-[11px] font-semibold">
                      {inactivos.length + categoriasInactivas.length}
                    </span>
                  )}
                </>
              ),
            },
          ]}
        />
      )}

      {mensaje && (
        <p role="status" className="aparecer flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-4 w-4 shrink-0" /> {mensaje}
        </p>
      )}
      {error && (
        <p role="alert" className="aparecer flex items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} aria-label="Cerrar aviso" className="rounded p-1 hover:bg-red-100">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}

      {vista === 'deshabilitados' && puedeEditar ? (
        <div key="deshabilitados" className="aparecer space-y-6">
          {/* Categorías deshabilitadas */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2">
              <Tag className="h-[18px] w-[18px] text-gray-400" /> Categorías deshabilitadas
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Sus productos las conservan. Al reactivarlas vuelven a ofrecerse en el formulario.
            </p>
            {categoriasInactivas.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No hay categorías deshabilitadas.</p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {categoriasInactivas.map((categoria) => (
                  <li
                    key={categoria.id}
                    className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-3.5 pr-1 text-sm text-gray-600"
                  >
                    <span className="line-through decoration-gray-300">{categoria.nombre}</span>
                    <button
                      onClick={() => reactivarCategoria(categoria)}
                      className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reactivar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Productos deshabilitados */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="flex items-center gap-2">
                <Package className="h-[18px] w-[18px] text-gray-400" /> Productos deshabilitados
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                No se venden ni reciben mercadería. Conservan su kardex y sus lotes.
              </p>
            </div>
            {inactivos.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                No hay productos deshabilitados.
              </p>
            ) : (
              <ul className="lista-animada divide-y divide-gray-50">
                {inactivos.map((producto) => (
                  <li key={producto.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{producto.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {producto.codigo ?? 'sin código'} ·{' '}
                        {producto.categoria_nombre ?? 'Sin categoría'} ·{' '}
                        {formatearStock(producto.stock_blisters, producto.unidades_por_caja)} en almacén
                      </p>
                    </div>
                    <button
                      onClick={() => reactivarProducto(producto)}
                      className="boton-primario flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                    >
                      <RotateCcw className="h-4 w-4" /> Reactivar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
      <>
      {/* ══════ Categorías ══════ */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="mr-2 text-sm font-medium text-gray-700">Categorías:</span>

          {categoriasActivas.length === 0 && (
            <span className="text-sm text-gray-400">aún no hay categorías</span>
          )}
          {categoriasActivas.map((categoria) =>
            editandoCategoria?.id === categoria.id ? (
              <form
                key={categoria.id}
                onSubmit={guardarCategoria}
                className="aparecer flex items-center gap-1 rounded-full bg-emerald-50 py-0.5 pl-1 pr-1"
              >
                <input
                  autoFocus
                  value={editandoCategoria.nombre}
                  maxLength={60}
                  onChange={(e) =>
                    setEditandoCategoria({ ...editandoCategoria, nombre: e.target.value })
                  }
                  onKeyDown={(e) => e.key === 'Escape' && setEditandoCategoria(null)}
                  aria-label="Nuevo nombre de la categoría"
                  className="w-36 rounded-full border border-emerald-300 px-3 py-1 text-xs outline-none"
                />
                <button type="submit" title="Guardar" className="rounded-full p-1 text-emerald-700 hover:bg-emerald-100">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Cancelar"
                  onClick={() => setEditandoCategoria(null)}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <span
                key={categoria.id}
                className={`group flex items-center gap-1 rounded-full py-1 pl-1 pr-2 text-xs font-medium transition-colors ${
                  categoriaFiltro === categoria.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => filtrarPorCategoria(categoria.id)}
                  aria-pressed={categoriaFiltro === categoria.id}
                  title={categoriaFiltro === categoria.id ? 'Quitar filtro' : `Ver solo ${categoria.nombre}`}
                  className="rounded-full px-2 py-0.5"
                >
                  {categoria.nombre}
                </button>
                {/* Editar / eliminar categoría: solo el ADMIN */}
                {puedeEditar && (
                  <>
                    <button
                      onClick={() =>
                        setEditandoCategoria({ id: categoria.id, nombre: categoria.nombre })
                      }
                      title="Renombrar categoría"
                      aria-label={`Renombrar ${categoria.nombre}`}
                      className="ml-0.5 rounded-full p-0.5 text-gray-400 transition hover:bg-blue-100 hover:text-blue-600"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => desactivarCategoria(categoria)}
                      title="Deshabilitar categoría"
                      aria-label={`Deshabilitar ${categoria.nombre}`}
                      className="rounded-full p-0.5 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                    >
                      <EyeOff className="h-3 w-3" />
                    </button>
                  </>
                )}
              </span>
            ),
          )}

          {puedeCrear && (
            <form onSubmit={crearCategoria} className="ml-auto flex items-center gap-2">
              <input
                value={nuevaCategoria}
                maxLength={60}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                placeholder="Nueva categoría…"
                aria-label="Nombre de la nueva categoría"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!nuevaCategoria.trim()}
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
              >
                Agregar
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ══════ Tabla del catálogo (30 por página) ══════ */}
      <div ref={inicioTabla} className="scroll-mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código, categoría o laboratorio…"
              aria-label="Buscar productos"
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {categoriaFiltro && (
              <button
                type="button"
                onClick={() => filtrarPorCategoria(categoriaFiltro)}
                className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                {categorias.find((c) => c.id === categoriaFiltro)?.nombre}
                <X className="h-3 w-3" aria-label="Quitar filtro de categoría" />
              </button>
            )}
            <span>
              {total} {total === 1 ? 'producto' : 'productos'}
              {hayFiltros ? ' encontrados' : ''}
            </span>
          </div>
        </div>

        {cargandoPagina ? (
          <div className="p-3">
            <EsqueletoTabla filas={8} columnas={puedeEditar ? 7 : 6} />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            {!hayFiltros
              ? `No hay productos registrados.${puedeCrear ? ' Cree el primero con "Nuevo producto".' : ''}`
              : 'Ningún producto coincide con la búsqueda o la categoría elegida.'}
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
                {filtrados.map((producto) => {
                  const conBlisters = tieneBlisters(producto);
                  return (
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
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {conBlisters ? (
                            <span className="inline-flex items-center gap-1 text-blue-600">
                              <PackageOpen className="h-3 w-3" />
                              {producto.unidades_por_caja} blísters por caja
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Package className="h-3 w-3" /> Sin blísters · venta por unidad
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {producto.categoria_nombre ?? 'Sin categoría'}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        <p className="whitespace-nowrap">
                          {conBlisters ? 'Caja' : 'Unidad'}: {formatearSoles(producto.precio_caja)}
                        </p>
                        {conBlisters && (
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
                          mínimo: {producto.stock_minimo} {nombreUnidadMinima(producto)}
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
                              aria-label={`Editar ${producto.nombre}`}
                              onClick={() => abrirEdicion(producto)}
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              title="Deshabilitar"
                              aria-label={`Deshabilitar ${producto.nombre}`}
                              onClick={() => desactivarProducto(producto)}
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                              <EyeOff className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación: máximo 30 productos por página */}
        {!cargandoPagina && resultado.totalPaginas > 1 && (
          <Paginacion
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
            total={resultado.total}
            porPagina={resultado.porPagina}
            onCambiar={irAPagina}
          />
        )}
      </div>
      </>
      )}

      {dialogo}

      {/* ══════ Modal de crear / editar producto ══════ */}
      {f && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-producto"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="titulo-producto" className="text-lg font-bold text-gray-900">
                {f.id ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button
                onClick={cerrarFormulario}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardarProducto} noValidate className="grid grid-cols-2 gap-4">
              {erroresFormulario.length > 0 && (
                <div
                  role="alert"
                  className="aparecer col-span-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <TriangleAlert className="h-4 w-4" /> Revise los datos del producto
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-6 text-xs">
                    {erroresFormulario.map((mensajeError) => (
                      <li key={mensajeError}>{mensajeError}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="col-span-2">
                <label htmlFor="producto-nombre" className="mb-1 block text-xs font-medium text-gray-600">
                  Nombre *
                </label>
                <input
                  id="producto-nombre"
                  required
                  maxLength={120}
                  value={f.nombre}
                  onChange={(e) => setFormulario({ ...f, nombre: e.target.value })}
                  placeholder="Paracetamol 500 mg"
                  className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 ${
                    intentoGuardar && !f.nombre.trim() ? 'campo-invalido' : ''
                  }`}
                />
              </div>

              <div>
                <label htmlFor="producto-codigo" className="mb-1 block text-xs font-medium text-gray-600">
                  Código / código de barras
                </label>
                <input
                  id="producto-codigo"
                  maxLength={40}
                  value={f.codigo}
                  onChange={(e) => setFormulario({ ...f, codigo: e.target.value })}
                  placeholder="PAR-500"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="producto-categoria" className="mb-1 block text-xs font-medium text-gray-600">
                  Categoría
                </label>
                <Selector
                  id="producto-categoria"
                  valor={f.categoriaId}
                  alCambiar={(valor) => setFormulario({ ...f, categoriaId: valor })}
                  etiquetaAccesible="Categoría"
                  opciones={[
                    { valor: '', etiqueta: 'Sin categoría' },
                    // Solo categorías activas, más la actual si fue deshabilitada
                    ...categorias
                      .filter((c) => c.activa !== false || c.id === f.categoriaId)
                      .map((c) => ({
                        valor: c.id,
                        etiqueta: c.nombre,
                        detalle: c.activa === false ? 'Deshabilitada' : undefined,
                      })),
                  ]}
                />
              </div>

              <div>
                <label htmlFor="producto-presentacion" className="mb-1 block text-xs font-medium text-gray-600">
                  Presentación
                </label>
                <input
                  id="producto-presentacion"
                  value={f.presentacion}
                  onChange={(e) => setFormulario({ ...f, presentacion: e.target.value })}
                  placeholder={f.tieneBlisters ? 'Caja x 10 blísters de 10 tabletas' : 'Frasco x 120 ml'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="producto-laboratorio" className="mb-1 block text-xs font-medium text-gray-600">
                  Laboratorio
                </label>
                <input
                  id="producto-laboratorio"
                  value={f.laboratorio}
                  onChange={(e) => setFormulario({ ...f, laboratorio: e.target.value })}
                  placeholder="Genfar"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {/* ══ Bloque de empaque: ¿se vende por blíster o por unidad? ══ */}
              <div className="col-span-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Package className="h-4 w-4 text-emerald-600" />
                  Empaque y precios
                </p>

                <fieldset disabled={f.empaqueBloqueado} className="mb-4">
                  <legend className="mb-2 text-xs font-medium text-gray-600">
                    ¿El producto viene en blísters? *
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      aria-pressed={f.tieneBlisters}
                      onClick={() =>
                        setFormulario({
                          ...f,
                          tieneBlisters: true,
                          unidadesPorCaja: Number(f.unidadesPorCaja) >= 2 ? f.unidadesPorCaja : '10',
                        })
                      }
                      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed ${
                        f.tieneBlisters
                          ? 'border-emerald-600 bg-white text-emerald-800 shadow-sm'
                          : 'border-gray-200 bg-white/60 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <PackageOpen className="h-5 w-5 shrink-0" />
                      <span>
                        <span className="block font-semibold">Sí, tiene blísters</span>
                        <span className="text-xs opacity-80">Se vende por caja o por blíster</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={!f.tieneBlisters}
                      onClick={() => setFormulario({ ...f, tieneBlisters: false })}
                      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed ${
                        !f.tieneBlisters
                          ? 'border-emerald-600 bg-white text-emerald-800 shadow-sm'
                          : 'border-gray-200 bg-white/60 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Package className="h-5 w-5 shrink-0" />
                      <span>
                        <span className="block font-semibold">No tiene blísters</span>
                        <span className="text-xs opacity-80">Frasco, jarabe, crema… se vende entero</span>
                      </span>
                    </button>
                  </div>
                  {f.empaqueBloqueado && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700">
                      <Lock className="h-3 w-3" />
                      El producto tiene mercadería en almacén: el empaque no se puede cambiar.
                    </p>
                  )}
                </fieldset>

                {f.tieneBlisters ? (
                  <div className="aparecer grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="producto-unidades" className="mb-1 block text-xs font-medium text-gray-600">
                        Blísters por caja *
                      </label>
                      <input
                        id="producto-unidades"
                        required
                        type="number"
                        min="2"
                        max="500"
                        step="1"
                        disabled={f.empaqueBloqueado}
                        value={f.unidadesPorCaja}
                        onChange={(e) => setFormulario({ ...f, unidadesPorCaja: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label htmlFor="producto-precio-caja" className="mb-1 block text-xs font-medium text-gray-600">
                        Precio por caja (S/) *
                      </label>
                      <input
                        id="producto-precio-caja"
                        required
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={f.precioCaja}
                        onChange={(e) => setFormulario({ ...f, precioCaja: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="producto-precio-blister" className="mb-1 block text-xs font-medium text-gray-600">
                        Precio por blíster (S/) *
                      </label>
                      <input
                        id="producto-precio-blister"
                        required
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={f.precioBlister}
                        onChange={(e) => setFormulario({ ...f, precioBlister: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    {totalPorBlisters !== null && precioCaja > 0 && (
                      <p
                        className={`col-span-full text-[11px] ${
                          totalPorBlisters >= precioCaja ? 'text-gray-500' : 'text-red-600'
                        }`}
                      >
                        Vendiendo los {unidades} blísters por separado se obtiene{' '}
                        <strong>{formatearSoles(totalPorBlisters)}</strong> frente a{' '}
                        <strong>{formatearSoles(precioCaja)}</strong> por la caja completa.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="aparecer grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="producto-precio-unidad" className="mb-1 block text-xs font-medium text-gray-600">
                        Precio de venta por unidad (S/) *
                      </label>
                      <input
                        id="producto-precio-unidad"
                        required
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={f.precioCaja}
                        onChange={(e) => setFormulario({ ...f, precioCaja: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="self-end pb-2 text-[11px] text-gray-500 sm:col-span-2">
                      Este producto se vende y se recibe siempre completo (1 unidad = 1 caja,
                      frasco o tubo). No podrá venderse por blíster.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="producto-stock-minimo" className="mb-1 block text-xs font-medium text-gray-600">
                  Stock mínimo (en {f.tieneBlisters ? 'blísters' : 'unidades'}) *
                </label>
                <input
                  id="producto-stock-minimo"
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={f.stockMinimo}
                  onChange={(e) => setFormulario({ ...f, stockMinimo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Debajo de este valor el estado pasa a Atención; bajo la mitad, a Crítico
                </p>
              </div>

              <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={f.requiereReceta}
                  onChange={(e) => setFormulario({ ...f, requiereReceta: e.target.checked })}
                  className="h-4 w-4 accent-emerald-600"
                />
                Requiere receta médica
              </label>

              <div className="col-span-2 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {guardando ? 'Guardando…' : f.id ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
