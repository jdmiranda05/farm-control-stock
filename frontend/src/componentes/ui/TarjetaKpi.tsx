import type { LucideIcon } from 'lucide-react';

/** Tonos disponibles para las tarjetas de métricas del Dashboard. */
type Tono = 'azul' | 'verde' | 'ambar' | 'rojo' | 'gris';

const ESTILOS_TONO: Record<Tono, { fondo: string; texto: string }> = {
  azul: { fondo: 'bg-blue-50', texto: 'text-blue-600' },
  verde: { fondo: 'bg-emerald-50', texto: 'text-emerald-600' },
  ambar: { fondo: 'bg-amber-50', texto: 'text-amber-600' },
  rojo: { fondo: 'bg-red-50', texto: 'text-red-600' },
  gris: { fondo: 'bg-gray-100', texto: 'text-gray-600' },
};

interface Props {
  titulo: string;
  valor: number | string;
  Icono: LucideIcon;
  tono: Tono;
  descripcion?: string;
}

/** Tarjeta de métrica (KPI) para el Dashboard. */
export function TarjetaKpi({ titulo, valor, Icono, tono, descripcion }: Props) {
  const estilos = ESTILOS_TONO[tono];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{titulo}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{valor}</p>
          {descripcion && <p className="mt-1 text-xs text-gray-400">{descripcion}</p>}
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-lg ${estilos.fondo} ${estilos.texto}`}>
          <Icono className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}
