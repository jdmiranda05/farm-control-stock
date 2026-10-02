import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onCambiar: (nuevaPagina: number) => void;
}

/**
 * Controles de paginación reutilizables.
 *
 * Los usan el Kardex, los lotes, el reporte diario y el historial de ventas.
 * La paginación es del lado del SERVIDOR: este componente solo avisa qué
 * página quiere ver el usuario; los datos los trae de nuevo la API.
 */
export function Paginacion({ pagina, totalPaginas, total, porPagina, onCambiar }: Props) {
  if (total === 0) return null;

  const primero = (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3">
      <p className="text-xs text-gray-500">
        Mostrando <span className="font-medium text-gray-700">{primero}</span>–
        <span className="font-medium text-gray-700">{ultimo}</span> de{' '}
        <span className="font-medium text-gray-700">{total}</span> registro(s)
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina <= 1}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>

        <span className="px-2 text-xs text-gray-500">
          Página <span className="font-semibold text-gray-700">{pagina}</span> de{' '}
          {totalPaginas}
        </span>

        <button
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
