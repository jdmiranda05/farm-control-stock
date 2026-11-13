import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LoaderCircle, type LucideIcon } from 'lucide-react';

/**
 * Diálogo de confirmación (reemplaza a window.confirm).
 *
 * Sigue las pautas de alertas de Apple (HIG › Alerts):
 *   - El título describe la situación; el texto solo agrega lo necesario.
 *   - El botón de acción usa un verbo concreto ("Deshabilitar", "Reactivar"),
 *     nunca "Aceptar"; "Cancelar" va a la izquierda y no es el predeterminado.
 *   - Se cierra con Esc o tocando fuera, y la animación es breve.
 */

export type TonoDialogo = 'peligro' | 'neutro' | 'exito';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje?: ReactNode;
  /** Texto del botón de acción: un verbo concreto. */
  accion: string;
  tono?: TonoDialogo;
  Icono?: LucideIcon;
  /**
   * Acción a ejecutar. Mientras corre, el diálogo muestra el progreso; si
   * falla, el error se muestra dentro del diálogo sin cerrarlo.
   */
  alConfirmar?: () => Promise<void>;
}

const ESTILO_TONO: Record<TonoDialogo, { boton: string; icono: string }> = {
  peligro: { boton: 'boton-peligro', icono: 'bg-red-50 text-red-600' },
  neutro: { boton: 'boton-oscuro', icono: 'bg-gray-100 text-gray-700' },
  exito: { boton: 'boton-primario', icono: 'bg-emerald-50 text-emerald-700' },
};

interface PropsDialogo extends OpcionesConfirmacion {
  abierto: boolean;
  alCerrar: (confirmado: boolean) => void;
}

/** Duración de la animación de salida (debe coincidir con global.css). */
const SALIDA_MS = 160;

export function DialogoConfirmacion({
  abierto,
  alCerrar,
  titulo,
  mensaje,
  accion,
  tono = 'neutro',
  Icono,
  alConfirmar,
}: PropsDialogo) {
  const [saliendo, setSaliendo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const estilo = ESTILO_TONO[tono];

  const cerrar = useCallback(
    (confirmado: boolean) => {
      setSaliendo(true);
      setTimeout(() => {
        setSaliendo(false);
        setError(null);
        alCerrar(confirmado);
      }, SALIDA_MS);
    },
    [alCerrar],
  );

  // Esc cancela; el foco entra al diálogo (sin botón predeterminado)
  useEffect(() => {
    if (!abierto) return;
    panel.current?.focus();
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !procesando) cerrar(false);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, procesando, cerrar]);

  async function confirmar() {
    if (!alConfirmar) return cerrar(true);
    setProcesando(true);
    setError(null);
    try {
      await alConfirmar();
      cerrar(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  if (!abierto) return null;

  return createPortal(
    <div
      className={`dialogo-fondo sistema-theme-portal fixed inset-0 z-[60] flex items-center justify-center p-4 ${
        saliendo ? 'saliendo' : ''
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !procesando) cerrar(false);
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby={mensaje ? 'dialogo-mensaje' : undefined}
        className="dialogo-panel w-full max-w-[400px] rounded-[22px] bg-white p-6 text-center outline-none"
      >
        {Icono && (
          <span
            className={`mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full ${estilo.icono}`}
          >
            <Icono className="h-6 w-6" aria-hidden="true" />
          </span>
        )}
        <h2 id="dialogo-titulo" className="text-[17px] font-semibold leading-snug text-[#1d1d1f]">
          {titulo}
        </h2>
        {mensaje && (
          <div id="dialogo-mensaje" className="mt-2 text-[14px] leading-relaxed text-[#6e6e73]">
            {mensaje}
          </div>
        )}
        {error && (
          <p role="alert" className="aparecer mt-4 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cerrar(false)}
            disabled={procesando}
            className="boton-gris h-11 rounded-full text-[15px] font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={procesando}
            className={`${estilo.boton} flex h-11 items-center justify-center gap-2 rounded-full text-[15px] font-semibold`}
          >
            {procesando && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {accion}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Hook de conveniencia:
 *   const { confirmar, dialogo } = useConfirmacion();
 *   if (await confirmar({ titulo, accion: 'Deshabilitar' })) { ... }
 *   return <>{...}{dialogo}</>;
 */
export function useConfirmacion() {
  const [opciones, setOpciones] = useState<OpcionesConfirmacion | null>(null);
  const resolver = useRef<((confirmado: boolean) => void) | null>(null);

  const origen = useRef<HTMLElement | null>(null);

  const confirmar = useCallback((nuevas: OpcionesConfirmacion) => {
    // Recordar qué control abrió el diálogo para devolverle el foco al cerrar
    origen.current = document.activeElement as HTMLElement | null;
    setOpciones(nuevas);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const alCerrar = useCallback((confirmado: boolean) => {
    resolver.current?.(confirmado);
    resolver.current = null;
    setOpciones(null);
    if (origen.current?.isConnected) origen.current.focus();
  }, []);

  const dialogo = opciones ? (
    <DialogoConfirmacion abierto {...opciones} alCerrar={alCerrar} />
  ) : null;

  return { confirmar, dialogo };
}
