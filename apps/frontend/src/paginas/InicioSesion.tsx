import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Cross, Eye, EyeOff, LoaderCircle, TriangleAlert } from 'lucide-react';
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
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

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

  async function solicitarCambioContrasena() {
    setError(null);
    setMensaje(null);
    if (!correo.trim()) {
      setError('Ingresa tu correo electrónico para enviarte el enlace de recuperación');
      return;
    }

    setRecuperando(true);
    const { error: errorAuth } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
      redirectTo: `${window.location.origin}/cambiar-contrasena`,
    });
    setRecuperando(false);

    if (errorAuth) {
      setError(errorAuth.message);
      return;
    }
    setMensaje('Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.');
  }

  return (
    <div className="inicio-sesion sistema-theme flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logotipo y título */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white">
            <Cross className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Botica</h1>
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
              placeholder="admin@botica.pe"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label htmlFor="contrasena" className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="contrasena"
                type={mostrarContrasena ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena((mostrar) => !mostrar)}
                aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-controls="contrasena"
                title={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98]"
              >
                {mostrarContrasena ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {mensaje && (
            <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {mensaje}
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
          <div className="text-center">
            <button
              type="button"
              onClick={solicitarCambioContrasena}
              disabled={recuperando || enviando}
              className="text-sm text-emerald-700 hover:underline disabled:opacity-60"
            >
              {recuperando ? 'Enviando enlace…' : '¿Olvidaste tu contraseña?'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Proyecto Universitario · Sistema Boticas · 2026
        </p>
      </div>
    </div>
  );
}
