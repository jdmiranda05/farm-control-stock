import { EstadoSemaforo } from '@botica/comun';

/**
 * Etiqueta visual del semáforo de estados.
 *
 * Se usa para los dos indicadores del sistema:
 *   - Estado de STOCK:       Normal / Atención / Crítico
 *   - Estado de VENCIMIENTO: En orden / Por vencer / Vencido
 */
const ESTILOS: Record<EstadoSemaforo, { clases: string; punto: string }> = {
  [EstadoSemaforo.VERDE]: {
    clases: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    punto: 'bg-emerald-500',
  },
  [EstadoSemaforo.AMARILLO]: {
    clases: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    punto: 'bg-amber-500',
  },
  [EstadoSemaforo.ROJO]: {
    clases: 'bg-red-50 text-red-700 ring-red-600/20',
    punto: 'bg-red-500',
  },
};

/** Texto por defecto cuando la etiqueta describe el nivel de STOCK. */
const TEXTO_STOCK: Record<EstadoSemaforo, string> = {
  [EstadoSemaforo.VERDE]: 'Normal',
  [EstadoSemaforo.AMARILLO]: 'Atención',
  [EstadoSemaforo.ROJO]: 'Crítico',
};

interface Props {
  estado: EstadoSemaforo;
  /** Texto opcional que reemplaza al genérico (ej. "Vence en 12 días"). */
  texto?: string;
}

export function EtiquetaEstado({ estado, texto }: Props) {
  const estilo = ESTILOS[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${estilo.clases}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${estilo.punto}`} />
      {texto ?? TEXTO_STOCK[estado]}
    </span>
  );
}
