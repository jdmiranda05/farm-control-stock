import { useEffect, useRef, useState } from 'react';
import { CalendarClock, CircleCheck, OctagonAlert, RefreshCw, TrendingDown } from 'lucide-react';
import {
  EstadoAlerta,
  TipoAlerta,
  type AlertaDetallada,
  type RespuestaPaginada,
} from '@botica/comun';
import { api } from '../lib/api';
import { Selector } from '../componentes/ui/Selector';
import { Paginacion } from '../componentes/ui/Paginacion';
import { EsqueletoAlertas, EsqueletoLista } from '../componentes/ui/Esqueleto';

/** Apariencia de cada tipo de alerta en el listado. */
const ESTILO_TIPO = {
  [TipoAlerta.STOCK_MINIMO]: {
    etiqueta: 'Stock mínimo',
    Icono: TrendingDown,
    clases: 'bg-amber-50 text-amber-600',
  },
  [TipoAlerta.VENCIMIENTO_PROXIMO]: {
    etiqueta: 'Vencimiento próximo',
    Icono: CalendarClock,
    clases: 'bg-amber-50 text-amber-600',
  },
  [TipoAlerta.VENCIDO]: {
    etiqueta: 'Vencido',
    Icono: OctagonAlert,
    clases: 'bg-red-50 text-red-600',
  },
} as const;

/** Las alertas en pantalla se refrescan solas cada minuto. */
const INTERVALO_REFRESCO_MS = 60_000;

/** Máximo de alertas por página (el backend tampoco acepta más). */
const ALERTAS_POR_PAGINA = 30;

/**
 * Página "Alertas": centro de notificaciones del sistema.
 *
 * Las alertas son AUTOMÁTICAS: al entrar a esta pantalla el backend
 * recalcula el motor de alertas contra el inventario actual (y lo repite
 * cada minuto mientras la pantalla esté abierta). Una alerta desaparece
 * sola cuando su causa se corrige: llega mercadería, se vende el lote o se
 * registra la merma. Por eso no hay botones para "resolver" a mano.
 */
export function Alertas() {
  const [resultado, setResultado] = useState<RespuestaPaginada<AlertaDetallada> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [cargandoPagina, setCargandoPagina] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>(EstadoAlerta.ACTIVA);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const inicioLista = useRef<HTMLDivElement>(null);
  const alertas = resultado?.datos ?? null;
  const [actualizando, setActualizando] = useState(false);
  const [actualizadoEn, setActualizadoEn] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const primeraCarga = useRef(true);

  useEffect(() => {
    let cancelado = false;

    const consulta = (recalcular: boolean) => {
      const parametros = new URLSearchParams({
        pagina: String(pagina),
        porPagina: String(ALERTAS_POR_PAGINA),
      });
      if (recalcular) parametros.set('recalcular', 'true');
      if (filtroEstado) parametros.set('estado', filtroEstado);
      if (filtroTipo) parametros.set('tipo', filtroTipo);
      return api.get<RespuestaPaginada<AlertaDetallada>>(`/alertas?${parametros.toString()}`);
    };

    async function cargar() {
      setActualizando(true);
      let llegoRecalculada = false;

      // 1) Lo guardado aparece al instante (sin esperar el recálculo)…
      const recalculada = consulta(true);
      consulta(false)
        .then((rapida) => {
          if (cancelado || llegoRecalculada) return;
          setResultado(rapida);
          setCargandoPagina(false);
        })
        .catch(() => undefined);

      // 2) …y se reemplaza por la lista recalculada en cuanto llega.
      try {
        const respuesta = await recalculada;
        llegoRecalculada = true;
        if (cancelado) return;

        // Si al recalcular se resolvieron alertas y esta página quedó vacía,
        // se pasa a la última página que sí tiene contenido.
        if (respuesta.datos.length === 0 && pagina > 1 && respuesta.total > 0) {
          setPagina(respuesta.totalPaginas);
          return;
        }
        setResultado(respuesta);
        setCargandoPagina(false);
        setActualizadoEn(new Date());
        setError(null);

        // Al verlas, las alertas activas dejan de ser "nuevas"
        if (respuesta.datos.some((a) => a.estado === EstadoAlerta.ACTIVA && !a.leida)) {
          await api.patch('/alertas/vistas').catch(() => undefined);
        }
        window.dispatchEvent(new Event('alertas-actualizadas'));
      } catch (e) {
        if (!cancelado) {
          setError((e as Error).message);
          setCargandoPagina(false);
        }
      } finally {
        if (!cancelado) setActualizando(false);
        primeraCarga.current = false;
      }
    }

    void cargar();
    const intervalo = setInterval(cargar, INTERVALO_REFRESCO_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [filtroEstado, filtroTipo, pagina]);

  /** Cambiar filtros o página: esqueleto solo en la lista y volver arriba. */
  function irAPagina(nueva: number) {
    setCargandoPagina(true);
    setPagina(nueva);
    inicioLista.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function cambiarFiltro(aplicar: () => void) {
    setCargandoPagina(true);
    aplicar();
    setPagina(1);
  }

  // Primera visita: esqueleto de toda la pantalla
  if (!resultado && !error) return <EsqueletoAlertas />;

  const total = resultado?.total ?? 0;
  const textoTotal =
    filtroEstado === EstadoAlerta.ACTIVA
      ? `${total} alerta${total === 1 ? '' : 's'} activa${total === 1 ? '' : 's'}`
      : filtroEstado === EstadoAlerta.RESUELTA
        ? `${total} alerta${total === 1 ? '' : 's'} resuelta${total === 1 ? '' : 's'}`
        : `${total} alerta${total === 1 ? '' : 's'} en total`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-sm text-gray-500">
            Stock mínimo y vencimientos — se actualizan automáticamente al ingresar y cada
            minuto
          </p>
        </div>
        <p
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs text-gray-500 shadow-sm"
          aria-live="polite"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-emerald-600 ${actualizando ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {actualizando
            ? 'Actualizando…'
            : actualizadoEn
              ? `Actualizado a las ${actualizadoEn.toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Sin actualizar'}
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Filtros */}
      <div ref={inicioLista} className="flex scroll-mt-4 flex-wrap items-center gap-3">
        <Selector
          className="w-56"
          valor={filtroEstado}
          alCambiar={(valor) => cambiarFiltro(() => setFiltroEstado(valor))}
          etiquetaAccesible="Filtrar por estado"
          opciones={[
            { valor: '', etiqueta: 'Todos los estados' },
            { valor: EstadoAlerta.ACTIVA, etiqueta: 'Activas' },
            { valor: EstadoAlerta.RESUELTA, etiqueta: 'Resueltas (historial)' },
          ]}
        />
        <Selector
          className="w-56"
          valor={filtroTipo}
          alCambiar={(valor) => cambiarFiltro(() => setFiltroTipo(valor))}
          etiquetaAccesible="Filtrar por tipo"
          opciones={[
            { valor: '', etiqueta: 'Todos los tipos' },
            { valor: TipoAlerta.STOCK_MINIMO, etiqueta: 'Stock mínimo' },
            { valor: TipoAlerta.VENCIMIENTO_PROXIMO, etiqueta: 'Vencimiento próximo' },
            { valor: TipoAlerta.VENCIDO, etiqueta: 'Vencido' },
          ]}
        />
        {resultado && <span className="text-sm text-gray-500">{textoTotal}</span>}
      </div>

      {/* Listado de alertas */}
      {!alertas || cargandoPagina ? (
        <EsqueletoLista elementos={6} />
      ) : alertas.length === 0 ? (
        <div className="aparecer rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <CircleCheck className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 text-sm text-emerald-700">
            No hay alertas con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
        <ul
          key={`${pagina}-${filtroEstado}-${filtroTipo}`}
          className="lista-animada space-y-3"
        >
          {alertas.map((alerta) => {
            const estilo = ESTILO_TIPO[alerta.tipo];
            const activa = alerta.estado === EstadoAlerta.ACTIVA;
            return (
              <li
                key={alerta.id}
                className={`flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                  activa ? 'border-gray-200' : 'border-gray-100 opacity-70'
                }`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${estilo.clases}`}>
                  <estilo.Icono className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {estilo.etiqueta}
                    </span>
                    {!alerta.leida && activa && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                        NUEVA
                      </span>
                    )}
                    {!activa && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                        RESUELTA AUTOMÁTICAMENTE
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-800">{alerta.mensaje}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(alerta.creado_en).toLocaleString('es-PE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {!activa && alerta.resuelto_en && (
                      <>
                        {' · resuelta el '}
                        {new Date(alerta.resuelto_en).toLocaleString('es-PE', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Paginación: máximo 30 alertas por página */}
        {resultado && resultado.totalPaginas > 1 && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <Paginacion
              pagina={resultado.pagina}
              totalPaginas={resultado.totalPaginas}
              total={resultado.total}
              porPagina={resultado.porPagina}
              onCambiar={irAPagina}
            />
          </div>
        )}
        </>
      )}
    </div>
  );
}
