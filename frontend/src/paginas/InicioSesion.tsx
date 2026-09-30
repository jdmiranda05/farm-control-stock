import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Cross, LoaderCircle, TriangleAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

/**
 * Pantalla pública de inicio de sesión.
 * La autenticación la realiza DIRECTAMENTE Supabase Auth (correo/contraseña);
 * el JWT resultante se adjunta luego a cada llamada a la API NestJS.
 */
export function InicioSesion() {
  const { sesion } = useAutenticacion();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesión activa, no tiene sentido mostrar el formulario
  if (sesion) return <Navigate to="/" replace />;

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const { error: errorAuth } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    setEnviando(false);
    if (errorAuth) {
      setError(
        errorAuth.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : errorAuth.message,
      );
      return;
    }
    navegar('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logotipo y título */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white">
            <Cross className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Botica SaaS</h1>
          <p className="mt-1 text-sm text-gray-500">
            Control de Inventario y Alertas para Boticas
          </p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div>
            <label htmlFor="correo" className="mb-1 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="admin@sanrafael.pe"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label htmlFor="contrasena" className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {enviando && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {enviando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Proyecto Universitario · Sistema SaaS Multi-tenant · 2026
        </p>
      </div>
    </div>
  );
}
