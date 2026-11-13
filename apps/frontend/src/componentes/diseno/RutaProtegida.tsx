import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { EsqueletoSistema } from '../ui/Esqueleto';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';

/**
 * Envoltorio de rutas privadas:
 *  - Mientras se verifica la sesión → esqueleto del sistema.
 *  - Sin sesión → redirige a /inicio-sesion.
 *  - Con sesión → muestra el contenido (el layout principal).
 */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useAutenticacion();

  if (cargando) return <EsqueletoSistema />;

  if (!sesion) return <Navigate to="/inicio-sesion" replace />;

  return <>{children}</>;
}
