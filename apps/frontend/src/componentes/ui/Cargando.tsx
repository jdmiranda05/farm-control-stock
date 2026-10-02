import { LoaderCircle } from 'lucide-react';

/** Indicador de carga reutilizable para las páginas. */
export function Cargando({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
      <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />
      <span>{mensaje}</span>
    </div>
  );
}
