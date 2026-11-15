import { useId, useRef, useState } from 'react';
import { Eye, X } from 'lucide-react';
import type { ProductoConStock } from '@botica/comun';

export function VistaPreviaProducto({
  producto,
}: {
  producto: Pick<ProductoConStock, 'nombre' | 'imagen_url'>;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const [abierta, setAbierta] = useState(false);
  const [error, setError] = useState(false);

  function abrir() {
    setError(false);
    setAbierta(true);
    dialogo.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Ver imagen de ${producto.nombre}`}
        aria-haspopup="dialog"
        title="Ver imagen del producto"
        onClick={abrir}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-700"
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby={tituloId}
        onClose={() => setAbierta(false)}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-2xl backdrop:bg-black/50"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={tituloId} className="break-words font-semibold text-gray-900">
            {producto.nombre}
          </h2>
          <form method="dialog">
            <button
              type="submit"
              aria-label="Cerrar vista previa"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
        {abierta && (
          producto.imagen_url && !error ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              referrerPolicy="no-referrer"
              onError={() => setError(true)}
              className="mx-auto max-h-[65dvh] max-w-full rounded-lg object-contain"
            />
          ) : (
            <p role="status" className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-600">
              {error ? 'No se pudo cargar la imagen.' : 'Este producto aún no tiene imagen.'}
            </p>
          )
        )}
      </dialog>
    </>
  );
}
