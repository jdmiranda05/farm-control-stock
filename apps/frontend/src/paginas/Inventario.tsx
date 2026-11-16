import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDownToLine, CircleCheck, PackageOpen, Search, TriangleAlert } from 'lucide-react';
import {
  EstadoSemaforo,
  UnidadEmpaque,
  diasParaVencer,
  formatearFecha,
  formatearSoles,
  formatearStock,
  hoyIso,
  tieneBlisters,
  type LoteDetallado,
  type ProductoConStock,
  type Proveedor,
  type RespuestaPaginada,
} from '@botica/comun';
import { api } from '../lib/api';
import { Selector } from '../componentes/ui/Selector';
import { EtiquetaEstado } from '../componentes/ui/EtiquetaEstado';
import { EsqueletoInventario, EsqueletoTabla } from '../componentes/ui/Esqueleto';
import { Paginacion } from '../componentes/ui/Paginacion';

/** Semáforo de un lote según cuánto le falta para vencer. */
function estadoDeLote(lote: LoteDetallado): { estado: EstadoSemaforo; texto: string } {
  const dias = diasParaVencer(lote.fecha_vencimiento);
  const enDias = (n: number) => `${n} día${n === 1 ? '' : 's'}`; // "1 día" / "3 días"
  if (dias < 0) return { estado: EstadoSemaforo.ROJO, texto: `Vencido hace ${enDias(-dias)}` };
  if (dias === 0) return { estado: EstadoSemaforo.AMARILLO, texto: 'Vence hoy' };
  if (dias <= 30) return { estado: EstadoSemaforo.AMARILLO, texto: `Vence en ${enDias(dias)}` };
  return { estado: EstadoSemaforo.VERDE, texto: `Vence en ${enDias(dias)}` };
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
  const [productos, setProductos] = useState<ProductoConStock[] | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [lotes, setLotes] = useState<RespuestaPaginada<LoteDetallado> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [cargandoLotes, setCargandoLotes] = useState(false);
  const [busquedaLotes, setBusquedaLotes] = useState('');
  const [busquedaLotesAplicada, setBusquedaLotesAplicada] = useState('');
  /** TODOS los lotes con mercadería (no solo la página visible), para la merma. */
  const [lotesConStock, setLotesConStock] = useState<LoteDetallado[]>([]);
  const formularioMerma = useRef<HTMLFormElement>(null);
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  // Avisos de cada formulario: se muestran DEBAJO de su botón, junto a la acción
  const [errorEntrada, setErrorEntrada] = useState<string | null>(null);
  const [exitoEntrada, setExitoEntrada] = useState<string | null>(null);
  const [errorMerma, setErrorMerma] = useState<string | null>(null);
  const [exitoMerma, setExitoMerma] = useState<string | null>(null);
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
      .catch((e: Error) => {
        setError(e.message);
        setProductos((actual) => actual ?? []);
      });
  }, []);

  const cargarLotes = useCallback(() => {
    const parametros = new URLSearchParams({ pagina: String(pagina), porPagina: '10' });
    if (soloVencidos) parametros.set('soloVencidos', 'true');
    if (busquedaLotesAplicada) parametros.set('busqueda', busquedaLotesAplicada);
    setCargandoLotes(true);
    api
      .get<RespuestaPaginada<LoteDetallado>>(`/inventario/lotes?${parametros}`)
      .then(setLotes)
      .catch((e: Error) => {
        setError(e.message);
        setLotes(
          (actual) =>
            actual ?? { datos: [], total: 0, pagina: 1, porPagina: 10, totalPaginas: 0 },
        );
      })
      .finally(() => setCargandoLotes(false));
  }, [pagina, soloVencidos, busquedaLotesAplicada]);

  // La búsqueda de lotes se aplica 300 ms después de dejar de escribir
  useEffect(() => {
    const t = setTimeout(() => {
      const texto = busquedaLotes.trim();
      setBusquedaLotesAplicada((anterior) => {
        if (anterior !== texto) setPagina(1);
        return texto;
      });
    }, 300);
    return () => clearTimeout(t);
  }, [busquedaLotes]);

  const cargarLotesConStock = useCallback(() => {
    api
      .get<RespuestaPaginada<LoteDetallado>>('/inventario/lotes?soloConStock=true&porPagina=100')
      .then((r) => setLotesConStock(r.datos))
      .catch(() => setLotesConStock([]));
  }, []);

  useEffect(cargarCatalogos, [cargarCatalogos]);
  useEffect(cargarLotesConStock, [cargarLotesConStock]);
  useEffect(cargarLotes, [cargarLotes]);

  /** Rellena el formulario de merma con un lote de la tabla y lo enfoca. */
  function prepararMerma(lote: LoteDetallado) {
    const porCaja = Math.max(lote.producto?.unidades_por_caja ?? 1, 1);
    const vencido = diasParaVencer(lote.fecha_vencimiento) < 0;
    // Se propone retirar TODO el lote: si hay blísters sueltos, la única forma
    // de cubrirlo completo es expresarlo en blísters (cajas × blísters + sueltos).
    const unidad =
      porCaja > 1 && lote.blisters_sueltos > 0 ? UnidadEmpaque.BLISTER : UnidadEmpaque.CAJA;
    const cantidad =
      unidad === UnidadEmpaque.BLISTER
        ? lote.cajas_completas * porCaja + lote.blisters_sueltos
        : lote.cajas_completas;
    setMerma({
      loteId: lote.id,
      cantidad: String(Math.max(cantidad, 1)),
      unidad,
      motivo: vencido ? 'Vencido' : 'Próximo a vencer',
    });
    setErrorMerma(null);
    setExitoMerma(null);
    formularioMerma.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => formularioMerma.current?.querySelector<HTMLInputElement>('input')?.focus(), 350);
  }

  /** Validaciones de la entrada antes de enviarla al servidor. */
  function validarEntrada(): string | null {
    if (!entrada.productoId) return 'Seleccione el producto que está recibiendo';
    if (!entrada.numeroLote.trim()) return 'Ingrese el número de lote';
    if (!/^[A-Za-z0-9._\-/ ]{2,40}$/.test(entrada.numeroLote.trim())) {
      return 'El número de lote solo puede tener letras, números y los signos - _ . /';
    }
    if (!entrada.fechaVencimiento) return 'Ingrese la fecha de vencimiento';
    const hoy = hoyIso();
    if (entrada.fechaVencimiento <= hoy) {
      return 'No se puede recibir mercadería vencida o que vence hoy: revise la fecha de vencimiento';
    }
    const cajas = Number(entrada.cantidadCajas);
    if (!Number.isInteger(cajas) || cajas < 1) return 'La cantidad debe ser un número entero mayor que 0';
    if (cajas > 10000) return 'La cantidad recibida es demasiado alta, revise el dato';
    const costo = Number(entrada.costoCaja);
    if (entrada.costoCaja === '' || !Number.isFinite(costo) || costo <= 0) {
      return 'El costo de compra debe ser mayor que 0';
    }
    if (productoEntrada && costo > Number(productoEntrada.precio_caja)) {
      return (
        `El costo (${formatearSoles(costo)}) es mayor que el precio de venta ` +
        `(${formatearSoles(productoEntrada.precio_caja)}): se vendería a pérdida`
      );
    }
    return null;
  }

  async function registrarEntrada(evento: FormEvent) {
    evento.preventDefault();
    setErrorEntrada(null);
    setExitoEntrada(null);
    const falla = validarEntrada();
    if (falla) {
      setErrorEntrada(falla);
      return;
    }
    setProcesando('entrada');
    try {
      await api.post('/inventario/entradas', {
        productoId: entrada.productoId,
        proveedorId: entrada.proveedorId || undefined,
        numeroLote: entrada.numeroLote.trim(),
        fechaVencimiento: entrada.fechaVencimiento,
        cantidadCajas: Number(entrada.cantidadCajas),
        costoCaja: Number(entrada.costoCaja),
      });
      setExitoEntrada(
        `Entrada registrada: ${entrada.cantidadCajas} ${
          productoEntrada && !tieneBlisters(productoEntrada) ? 'unidad(es)' : 'caja(s)'
        } del lote ${entrada.numeroLote.trim()}.`,
      );
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
      cargarLotesConStock();
    } catch (e) {
      setErrorEntrada((e as Error).message);
    } finally {
      setProcesando(null);
    }
  }

  async function registrarMerma(evento: FormEvent) {
    evento.preventDefault();
    setErrorMerma(null);
    setExitoMerma(null);
    if (!loteMerma) {
      setErrorMerma('Seleccione el lote afectado');
      return;
    }
    const cantidad = Number(merma.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setErrorMerma('La cantidad de la merma debe ser un número entero mayor que 0');
      return;
    }
    if (cantidad > maximoMerma) {
      setErrorMerma(
        `El lote ${loteMerma.numero_lote} solo tiene ${maximoMerma} ` +
          `${merma.unidad === UnidadEmpaque.CAJA ? nombreCajas : 'blíster(es)'} disponibles`,
      );
      return;
    }
    if (merma.motivo.trim().length < 3) {
      setErrorMerma('Describa el motivo de la merma (mínimo 3 caracteres)');
      return;
    }
    setProcesando('merma');
    try {
      const respuesta = await api.post<{ mensaje: string; valorMermaSoles: number }>(
        '/inventario/mermas',
        {
          loteId: merma.loteId,
          cantidad: Number(merma.cantidad),
          unidad: merma.unidad,
          motivo: merma.motivo.trim(),
        },
      );
      setExitoMerma(
        `${respuesta.mensaje} Pérdida valorizada en ${formatearSoles(respuesta.valorMermaSoles)}.`,
      );
      setMerma({ loteId: '', cantidad: '1', unidad: UnidadEmpaque.CAJA, motivo: '' });
      cargarCatalogos();
      cargarLotes();
      cargarLotesConStock();
    } catch (e) {
      setErrorMerma((e as Error).message);
    } finally {
      setProcesando(null);
    }
  }

  // ---- Datos derivados de lo seleccionado en los formularios ----
  const productoEntrada = productos?.find((p) => p.id === entrada.productoId) ?? null;
  const loteMerma = lotesConStock.find((l) => l.id === merma.loteId) ?? null;
  const loteMermaConBlisters = loteMerma?.producto
    ? tieneBlisters({ unidades_por_caja: loteMerma.producto.unidades_por_caja })
    : true;
  const nombreCajas = loteMermaConBlisters ? 'caja(s)' : 'unidad(es)';
  const porCajaMerma = Math.max(loteMerma?.producto?.unidades_por_caja ?? 1, 1);
  const maximoMerma = loteMerma
    ? merma.unidad === UnidadEmpaque.CAJA
      ? loteMerma.cajas_completas
      : loteMerma.cajas_completas * porCajaMerma + loteMerma.blisters_sueltos
    : 0;
  const ahora = new Date(Date.now() + 86_400_000);
  const manana = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);

  if (!productos || !lotes) return <EsqueletoInventario />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lotes e Inventario</h1>
        <p className="text-sm text-gray-500">
          Recepción de mercadería y control de vencimientos por lote
        </p>
      </div>

      {mensaje && (
        <p role="status" className="aparecer rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {mensaje}
        </p>
      )}
      {error && (
        <p role="alert" className="aparecer rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ══════ ENTRADA MANUAL ══════ */}
        <form
          onSubmit={registrarEntrada}
          noValidate
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownToLine className="h-4 w-4" />
            </span>
            Registrar entrada de mercadería
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Las entradas se registran siempre en CAJAS (o UNIDADES si el producto no tiene
            blísters), tal como llegan del proveedor.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Producto *</label>
              <Selector
                valor={entrada.productoId}
                alCambiar={(valor) => setEntrada({ ...entrada, productoId: valor })}
                etiquetaAccesible="Producto"
                marcador="Seleccione un producto…"
                buscable
                marcadorBusqueda="Buscar por nombre…"
                opciones={productos.map((producto) => ({
                  valor: producto.id,
                  etiqueta: producto.nombre,
                  detalle: tieneBlisters(producto)
                    ? `${producto.unidades_por_caja} blísters por caja`
                    : 'Sin blísters · se recibe por unidad',
                }))}
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Proveedor</label>
              <Selector
                valor={entrada.proveedorId}
                alCambiar={(valor) => setEntrada({ ...entrada, proveedorId: valor })}
                etiquetaAccesible="Proveedor"
                buscable
                marcadorBusqueda="Buscar por nombre o RUC…"
                opciones={[
                  { valor: '', etiqueta: 'Sin especificar' },
                  ...proveedores.map((p) => ({
                    valor: p.id,
                    etiqueta: p.nombre,
                    detalle: p.ruc ? `RUC ${p.ruc}` : undefined,
                  })),
                ]}
              />
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
                min={manana}
                value={entrada.fechaVencimiento}
                onChange={(e) => setEntrada({ ...entrada, fechaVencimiento: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Cantidad de {productoEntrada && !tieneBlisters(productoEntrada) ? 'unidades' : 'cajas'} *
              </label>
              <input
                required
                type="number"
                step="1"
                max="10000"
                min="1"
                value={entrada.cantidadCajas}
                onChange={(e) => setEntrada({ ...entrada, cantidadCajas: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Costo por {productoEntrada && !tieneBlisters(productoEntrada) ? 'unidad' : 'caja'} (S/) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
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
          {/* Avisos del formulario, justo debajo del botón */}
          <div aria-live="polite">
            {errorEntrada && (
              <p
                id="error-entrada"
                role="alert"
                className="aparecer mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {errorEntrada}
              </p>
            )}
            {exitoEntrada && (
              <p
                role="status"
                className="aparecer mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {exitoEntrada}
              </p>
            )}
          </div>
        </form>

        {/* ══════ MERMA ══════ */}
        <form
          ref={formularioMerma}
          onSubmit={registrarMerma}
          noValidate
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
              <Selector
                valor={merma.loteId}
                alCambiar={(valor) => {
                  const lote = lotesConStock.find((l) => l.id === valor);
                  const conBlisters = (lote?.producto?.unidades_por_caja ?? 1) > 1;
                  setMerma({
                    ...merma,
                    loteId: valor,
                    // Sin blísters no existe la unidad "blíster"
                    unidad: conBlisters ? merma.unidad : UnidadEmpaque.CAJA,
                  });
                }}
                etiquetaAccesible="Lote afectado"
                marcador="Seleccione el lote afectado…"
                buscable
                marcadorBusqueda="Buscar por producto o N° de lote…"
                opciones={lotesConStock.map((lote) => {
                  const dias = diasParaVencer(lote.fecha_vencimiento);
                  return {
                    valor: lote.id,
                    etiqueta: `${lote.producto?.nombre ?? 'Producto'} — ${lote.numero_lote}`,
                    detalle:
                      (dias < 0 ? 'Vencido el ' : 'Vence el ') +
                      formatearFecha(lote.fecha_vencimiento) +
                      ' · ' +
                      formatearStock(
                        lote.cajas_completas * Math.max(lote.producto?.unidades_por_caja ?? 1, 1) +
                          lote.blisters_sueltos,
                        lote.producto?.unidades_por_caja ?? 1,
                      ),
                  };
                })}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Todos los lotes con mercadería, el más próximo a vencer primero
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Cantidad *</label>
              <input
                required
                type="number"
                min="1"
                step="1"
                max={loteMerma ? maximoMerma : undefined}
                value={merma.cantidad}
                onChange={(e) => setMerma({ ...merma, cantidad: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Unidad *</label>
              <Selector
                valor={merma.unidad}
                alCambiar={(valor) => setMerma({ ...merma, unidad: valor as UnidadEmpaque })}
                etiquetaAccesible="Unidad de la merma"
                opciones={[
                  { valor: UnidadEmpaque.CAJA, etiqueta: loteMermaConBlisters ? 'Cajas' : 'Unidades' },
                  ...(loteMermaConBlisters
                    ? [{ valor: UnidadEmpaque.BLISTER, etiqueta: 'Blísters' }]
                    : []),
                ]}
              />
              {loteMerma && (
                <p className="mt-1 text-[11px] text-gray-400">Máximo: {maximoMerma}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Motivo *</label>
              <input
                required
                maxLength={200}
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
          {/* Avisos del formulario, justo debajo del botón */}
          <div aria-live="polite">
            {errorMerma && (
              <p
                id="error-merma"
                role="alert"
                className="aparecer mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {errorMerma}
              </p>
            )}
            {exitoMerma && (
              <p
                role="status"
                className="aparecer mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {exitoMerma}
              </p>
            )}
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-gray-800">Antes de registrar</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                Verifica el lote, la cantidad y la unidad de empaque. Describe el motivo
                del retiro para facilitar su seguimiento en el Kardex.
              </p>
            </div>
          </div>
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
          <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busquedaLotes}
              onChange={(e) => setBusquedaLotes(e.target.value)}
              maxLength={60}
              placeholder="Buscar lote, producto o proveedor…"
              aria-label="Buscar lotes"
              className="w-72 max-w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            />
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
        </div>

        {cargandoLotes ? (
          <div className="p-3">
            <EsqueletoTabla filas={5} columnas={7} />
          </div>
        ) : lotes.datos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            {busquedaLotesAplicada
              ? `Ningún lote coincide con "${busquedaLotesAplicada}".`
              : soloVencidos
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
                    <th className="px-5 py-3 text-right">
                      <span className="sr-only">Acción</span>
                    </th>
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
                            {lote.cajas_completas} {porCaja > 1 ? 'caja(s)' : 'unidad(es)'}
                          </p>
                          {lote.blisters_sueltos > 0 && (
                            <p className="flex items-center justify-center gap-1 text-xs text-blue-600">
                              <PackageOpen className="h-3 w-3" />
                              {lote.blisters_sueltos} blíster(es) sueltos
                            </p>
                          )}
                          {porCaja > 1 && (
                            <p className="text-xs text-gray-400">
                              {formatearStock(totalBlisters, porCaja)}
                            </p>
                          )}
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
                        <td className="px-5 py-3 text-right">
                          {/* Atajo: retirar un lote vencido o por vencer sin buscarlo */}
                          {totalBlisters > 0 && estado !== EstadoSemaforo.VERDE && (
                            <button
                              type="button"
                              onClick={() => prepararMerma(lote)}
                              className="whitespace-nowrap rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              Registrar merma
                            </button>
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
