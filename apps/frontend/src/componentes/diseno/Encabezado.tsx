import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, LogOut } from 'lucide-react';
import type { ContadorAlertas } from '@botica/comun';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { api } from '../../lib/api';
import { NOMBRE_ROL } from '../../lib/permisos';

/**
 * Encabezado superior (requisito de navegación):
 *   - Nombre de la botica actual (el "tenant" activo).
 *   - Centro de notificaciones: campanita con contador de alertas activas.
 *   - Perfil del usuario activo + botón de cierre de sesión.
 */
export function Encabezado() {
  const { perfil, cerrarSesion, errorPerfil } = useAutenticacion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [contador, setContador] = useState<ContadorAlertas>({ activas: 0, noLeidas: 0 });

  // Refresca el contador al cambiar de página y luego cada 60 segundos
  useEffect(() => {
    if (!perfil) return;
    const consultar = () =>
      api
        .get<ContadorAlertas>('/alertas/contador')
        .then(setContador)
        .catch(() => {}); // silencioso: la campanita no debe romper la página

    consultar();
    const intervalo = setInterval(consultar, 60_000);
    return () => clearInterval(intervalo);
  }, [perfil, ubicacion.pathname]);

  const iniciales = (perfil?.nombre_completo ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Botica actual (inquilino activo del SaaS) */}
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-800">
            {perfil?.botica?.nombre ?? 'Botica no asignada'}
          </p>
          <p className="text-xs text-gray-500">
            {perfil?.botica?.ruc ? `RUC ${perfil.botica.ruc}` : 'Sistema de inventario'}
          </p>
        </div>
      </div>

      {/* Aviso si el backend no está disponible */}
      {errorPerfil && (
        <p className="hidden rounded-md bg-amber-50 px-3 py-1 text-xs text-amber-700 md:block">
          ⚠ No se pudo cargar el perfil desde la API: {errorPerfil}
        </p>
      )}

      <div className="flex items-center gap-5">
        {/* Centro de notificaciones */}
        <button
          onClick={() => navegar('/alertas')}
          title="Ver alertas"
          className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Bell className="h-5 w-5" />
          {contador.activas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {contador.activas > 99 ? '99+' : contador.activas}
            </span>
          )}
        </button>

        {/* Usuario activo */}
        <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-xs font-bold text-white">
            {iniciales || '—'}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-gray-800">
              {perfil?.nombre_completo ?? 'Usuario'}
            </p>
            <p className="text-xs text-gray-500">
              {perfil ? NOMBRE_ROL[perfil.rol] : '—'}
            </p>
          </div>
          <button
            onClick={async () => {
              await cerrarSesion();
              navegar('/inicio-sesion');
            }}
            title="Cerrar sesión"
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
