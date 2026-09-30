import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { PerfilUsuario } from '@botica/comun';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { NOMBRE_ROL } from '../../lib/permisos';

interface Props {
  /** Función de permiso de src/lib/permisos.ts (ej. puedeVender). */
  permitido: (perfil: PerfilUsuario | null) => boolean;
  children: ReactNode;
}

/**
 * Protege una página según el rol del usuario.
 *
 * Si no tiene permiso, muestra un aviso claro en lugar de una pantalla en
 * blanco. El backend igualmente rechazaría la petición: esta comprobación
 * es solo para dar una explicación entendible al usuario.
 */
export function RutaPorRol({ permitido, children }: Props) {
  const { perfil } = useAutenticacion();

  if (!permitido(perfil)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-4 text-lg font-bold text-amber-900">Acceso restringido</h2>
        <p className="mt-2 text-sm text-amber-700">
          Su rol ({perfil ? NOMBRE_ROL[perfil.rol] : 'desconocido'}) no tiene permiso para
          ver esta sección.
        </p>
        <p className="mt-1 text-xs text-amber-600">
          Si necesita acceso, solicítelo al administrador de la botica.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
