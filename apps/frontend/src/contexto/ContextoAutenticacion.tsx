import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import type { PerfilUsuario } from '@botica/comun';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

/**
 * Contexto global de autenticación.
 * Combina dos fuentes:
 *   1. La SESIÓN de Supabase Auth (correo + JWT).
 *   2. El PERFIL de negocio que entrega el backend (rol + botica del usuario).
 */
interface ValorContextoAutenticacion {
  sesion: Session | null;
  perfil: PerfilUsuario | null;
  cargando: boolean;
  errorPerfil: string | null;
  cerrarSesion: () => Promise<void>;
}

const ContextoAutenticacion = createContext<ValorContextoAutenticacion>({
  sesion: null,
  perfil: null,
  cargando: true,
  errorPerfil: null,
  cerrarSesion: async () => {},
});

export function ProveedorAutenticacion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  // 1) Escuchar la sesión de Supabase Auth (inicio y cierre de sesión)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      if (!data.session) setCargando(false);
    });

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion);
      if (!nuevaSesion) {
        setPerfil(null);
        setCargando(false);
      }
    });
    return () => suscripcion.subscription.unsubscribe();
  }, []);

  // 2) Con sesión activa → pedir el perfil de negocio al backend
  useEffect(() => {
    if (!sesion) return;
    let cancelado = false;

    api
      .get<PerfilUsuario>('/autenticacion/perfil')
      .then((datos) => {
        if (cancelado) return;
        setPerfil(datos);
        setErrorPerfil(null);
      })
      .catch((error: Error) => {
        if (cancelado) return;
        setPerfil(null);
        setErrorPerfil(error.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [sesion]);

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut();
    setPerfil(null);
  }, []);

  return (
    <ContextoAutenticacion.Provider
      value={{ sesion, perfil, cargando, errorPerfil, cerrarSesion }}
    >
      {children}
    </ContextoAutenticacion.Provider>
  );
}

/** Hook de conveniencia: const { perfil, cerrarSesion } = useAutenticacion(); */
export function useAutenticacion() {
  return useContext(ContextoAutenticacion);
}
