import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { RolUsuario, type PerfilUsuario } from '@botica/comun';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { NOMBRE_ROL } from '../../lib/permisos';

interface Props {
  /** Función de permiso de src/lib/permisos.ts (ej. puedeVender). */
  permitido: (perfil: PerfilUsuario | null) => boolean;
  children: ReactNode;
}

/** A dónde volver según el rol: la pantalla principal de cada uno. */
const INICIO_POR_ROL: Record<RolUsuario, { ruta: string; nombre: string }> = {
  [RolUsuario.ADMIN]: { ruta: '/', nombre: 'Ir al Dashboard' },
  [RolUsuario.ALMACENERO]: { ruta: '/inventario', nombre: 'Ir a Lotes e Inventario' },
  [RolUsuario.VENDEDOR]: { ruta: '/punto-venta', nombre: 'Ir al Punto de Venta' },
};

/**
 * Protege una página según el rol del usuario.
 *
 * Si no tiene permiso, explica por qué y ofrece volver a su pantalla
 * principal. El backend igualmente rechazaría la petición: esta comprobación
 * es solo para dar una explicación entendible al usuario.
 */
export function RutaPorRol({ permitido, children }: Props) {
  const { perfil } = useAutenticacion();

  if (!permitido(perfil)) {
    const inicio = perfil ? INICIO_POR_ROL[perfil.rol] : null;
    const explicacion =
      perfil?.rol === RolUsuario.ADMIN
        ? 'El administrador supervisa y gestiona el catálogo; esta tarea operativa la realizan el almacenero o el vendedor.'
        : 'Esta sección corresponde a otro rol. Si necesita acceso, solicítelo al administrador de la botica.';

    return (
      <div className="aparecer mx-auto mt-10 max-w-md rounded-2xl bg-white p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5">Esta sección no está disponible para su rol</h2>
        <p className="mt-2 text-sm text-gray-500">
          Su rol es <strong className="text-gray-700">{perfil ? NOMBRE_ROL[perfil.rol] : 'desconocido'}</strong>.{' '}
          {explicacion}
        </p>
        {inicio && (
          <Link
            to={inicio.ruta}
            className="boton-primario mt-6 inline-flex h-11 items-center rounded-full px-6 text-[15px] font-semibold"
          >
            {inicio.nombre}
          </Link>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
