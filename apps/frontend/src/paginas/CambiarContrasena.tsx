import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Cross, LoaderCircle, TriangleAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

/** Pantalla para establecer una contraseña nueva desde el enlace de recuperación. */
export function CambiarContrasena() {
  const { sesion } = useAutenticacion();
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [completado, setCompletado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (completado) {
    return (
      <div className="inicio-sesion sistema-theme flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-gray-900">Contraseña actualizada</h1>
          <p className="mt-3 text-sm text-gray-600">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link to="/inicio-sesion" className="mt-6 inline-block font-semibold text-emerald-700 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  // El enlace de recuperación crea una sesión temporal de Supabase.
  if (!sesion) return <Navigate to="/inicio-sesion" replace />;

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setEnviando(true);
    const { error: errorAuth } = await supabase.auth.updateUser({ password: contrasena });
    setEnviando(false);
    if (errorAuth) {
      setError(errorAuth.message);
      return;
    }
    await supabase.auth.signOut();
    setCompletado(true);
  }

  return (
    <div className="inicio-sesion sistema-theme flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white">
            <Cross className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Cambiar contraseña</h1>
          <p className="mt-2 text-sm text-gray-500">Elige una contraseña nueva para tu cuenta.</p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div>
            <label htmlFor="nueva-contrasena" className="mb-1 block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <input
              id="nueva-contrasena"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label htmlFor="confirmar-contrasena" className="mb-1 block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmar-contrasena"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmacion}
              onChange={(evento) => setConfirmacion(evento.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {enviando && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {enviando ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
