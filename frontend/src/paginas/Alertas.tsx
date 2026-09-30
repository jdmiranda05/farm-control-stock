import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Check, Eye, OctagonAlert, RefreshCw, TrendingDown } from 'lucide-react';
import {
  EstadoAlerta,
  TipoAlerta,
  type AlertaDetallada,
  type ResumenGeneracionAlertas,
} from '@botica/comun';
import { api } from '../lib/api';
import { Cargando } from '../componentes/ui/Cargando';

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

/**
 * Página "Alertas": centro de notificaciones del sistema.
 * Permite filtrar por estado/tipo, forzar el recálculo del motor de alertas
 * y gestionar cada alerta (marcar leída / resolver).
 */
export function Alertas() {
  const [alertas, setAlertas] = useState<AlertaDetallada[] | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>(EstadoAlerta.ACTIVA);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [recalculando, setRecalculando] = useState(false);
  const [resumen, setResumen] = useState<ResumenGeneracionAlertas | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    const parametros = new URLSearchParams();
    if (filtroEstado) parametros.set('estado', filtroEstado);
    if (filtroTipo) parametros.set('tipo', filtroTipo);

    api
      .get<AlertaDetallada[]>(`/alertas?${parametros.toString()}`)
      .then(setAlertas)
      .catch((e: Error) => setError(e.message));
  }, [filtroEstado, filtroTipo]);

  useEffect(cargar, [cargar]);

  /** Fuerza el recálculo (misma lógica que ejecuta el cron cada hora). */
  async function recalcular() {
    setRecalculando(true);
    setError(null);
    try {
      const resultado = await api.post<ResumenGeneracionAlertas>('/alertas/generar');
      setResumen(resultado);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRecalculando(false);
    }
  }

  async function marcarLeida(alerta: AlertaDetallada) {
    await api.patch(`/alertas/${alerta.id}/leida`).catch((e: Error) => setError(e.message));
    cargar();
  }

  async function resolver(alerta: AlertaDetallada) {
    await api.patch(`/alertas/${alerta.id}/resolver`).catch((e: Error) => setError(e.message));
    cargar();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-sm text-gray-500">
            Stock mínimo y vencimientos — se recalculan automáticamente cada hora
          </p>
        </div>
        <button
          onClick={recalcular}
          disabled={recalculando}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${recalculando ? 'animate-spin' : ''}`} />
          Recalcular ahora
        </button>
      </div>

      {resumen && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Recalculo completado: {resumen.creadas} creadas · {resumen.actualizadas} actualizadas ·{' '}
          {resumen.resueltas} resueltas · {resumen.vigentes} vigentes.
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">Todos los estados</option>
          <option value={EstadoAlerta.ACTIVA}>Activas</option>
          <option value={EstadoAlerta.RESUELTA}>Resueltas</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">Todos los tipos</option>
          <option value={TipoAlerta.STOCK_MINIMO}>Stock mínimo</option>
          <option value={TipoAlerta.VENCIMIENTO_PROXIMO}>Vencimiento próximo</option>
          <option value={TipoAlerta.VENCIDO}>Vencido</option>
        </select>
      </div>

      {/* Listado de alertas */}
      {!alertas ? (
        <Cargando mensaje="Cargando alertas…" />
      ) : alertas.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-emerald-600">
            🟢 No hay alertas con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alertas.map((alerta) => {
            const estilo = ESTILO_TIPO[alerta.tipo];
            const activa = alerta.estado === EstadoAlerta.ACTIVA;
            return (
              <li
                key={alerta.id}
                className={`flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm ${
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
                        RESUELTA
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-800">{alerta.mensaje}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(alerta.creado_en).toLocaleString('es-PE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                {activa && (
                  <div className="flex shrink-0 gap-2">
                    {!alerta.leida && (
                      <button
                        onClick={() => marcarLeida(alerta)}
                        title="Marcar como leída"
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> Leída
                      </button>
                    )}
                    <button
                      onClick={() => resolver(alerta)}
                      title="Resolver manualmente"
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Resolver
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
