import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';

/**
 * Envoltorio de rutas privadas:
 *  - Mientras se verifica la sesión → pantalla de carga.
 *  - Sin sesión → redirige a /inicio-sesion.
 *  - Con sesión → muestra el contenido (el layout principal).
 */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useAutenticacion();

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
          <p>Verificando sesión…</p>
        </div>
      </div>
    );
  }

  if (!sesion) return <Navigate to="/inicio-sesion" replace />;

  return <>{children}</>;
}
