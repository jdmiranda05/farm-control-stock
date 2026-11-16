import { useState } from 'react';
import { FileSpreadsheet, LoaderCircle, TriangleAlert } from 'lucide-react';
import { api } from '../../lib/api';

interface Props {
  /** Ruta de la API que genera el Excel, con sus filtros (ej. "/kardex/exportar?desde=…"). */
  ruta: string;
  nombrePorDefecto: string;
  etiqueta?: string;
  /** Si hay un motivo, el botón queda deshabilitado y lo muestra como ayuda. */
  motivoDeshabilitado?: string | null;
}

/**
 * Botón "Exportar a Excel". Pide el archivo a la API (que incluye TODOS los
 * registros del periodo, no solo la página visible) y lo descarga. Mientras
 * se genera muestra el progreso y, si falla, explica el motivo al lado.
 */
export function BotonExportarExcel({
  ruta,
  nombrePorDefecto,
  etiqueta = 'Exportar a Excel',
  motivoDeshabilitado,
}: Props) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportar() {
    setGenerando(true);
    setError(null);
    try {
      await api.descargar(ruta, nombrePorDefecto);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5 print:hidden">
      <button
        type="button"
        onClick={exportar}
        disabled={generando || !!motivoDeshabilitado}
        title={motivoDeshabilitado ?? 'Descargar en formato Excel (.xlsx)'}
        className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
      >
        {generando ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
        )}
        {generando ? 'Generando Excel…' : etiqueta}
      </button>
      {error && (
        <p role="alert" className="aparecer flex max-w-xs items-start gap-1.5 text-right text-xs text-red-600">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
