import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Cross, Eye, EyeOff, LoaderCircle, TriangleAlert } from 'lucide-react';
import { esCorreoValido } from '@botica/comun';
import { supabase } from '../lib/supabase';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

/** Devuelve el motivo por el que el correo no es válido, o null si lo es. */
function validarCorreo(valor: string): string | null {
  const limpio = valor.trim();
  if (!limpio) return 'Ingresa tu correo electrónico';
  if (/\s/.test(limpio)) return 'El correo no puede contener espacios';
  if (!limpio.includes('@')) return 'Al correo le falta el símbolo "@"';
  if ((limpio.match(/@/g) ?? []).length > 1) return 'El correo solo puede tener un "@"';
  const [usuario, dominio] = limpio.split('@');
  if (!usuario) return 'Falta el nombre antes de "@" (ej. nombre@botica.pe)';
  if (!dominio || !dominio.includes('.')) {
    return 'Falta el dominio después de "@" (ej. nombre@botica.pe)';
  }
  if (!esCorreoValido(limpio)) return 'El formato del correo no es válido (ej. nombre@botica.pe)';
  return null;
}

/** Traduce al español los mensajes más comunes de Supabase Auth. */
function traducirErrorAuth(mensajeAuth: string): string {
  if (mensajeAuth === 'Invalid login credentials') return 'Correo o contraseña incorrectos';
  if (/email not confirmed/i.test(mensajeAuth)) return 'El correo aún no ha sido confirmado';
  if (/rate limit|too many/i.test(mensajeAuth)) {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo';
  }
  if (/invalid.*email|unable to validate email/i.test(mensajeAuth)) {
    return 'El correo electrónico no es válido';
  }
  if (/failed to fetch|network/i.test(mensajeAuth)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet';
  }
  return mensajeAuth;
}

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
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [errorContrasena, setErrorContrasena] = useState<string | null>(null);
  const [correoTocado, setCorreoTocado] = useState(false);

  // Si ya hay sesión activa, no tiene sentido mostrar el formulario
  if (sesion) return <Navigate to="/" replace />;

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setCorreoTocado(true);

    // 1) Validación local: no se consulta al servidor con datos mal formados
    const fallaCorreo = validarCorreo(correo);
    const fallaContrasena = contrasena ? null : 'Ingresa tu contraseña';
    setErrorCorreo(fallaCorreo);
    setErrorContrasena(fallaContrasena);
    if (fallaCorreo) {
      document.getElementById('correo')?.focus();
      return;
    }
    if (fallaContrasena) {
      document.getElementById('contrasena')?.focus();
      return;
    }

    // 2) Autenticación contra Supabase Auth
    setEnviando(true);
    const { error: errorAuth } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password: contrasena,
    });

    setEnviando(false);
    if (errorAuth) {
      setError(traducirErrorAuth(errorAuth.message));
      return;
    }
    navegar('/');
  }

  async function solicitarCambioContrasena() {
    setError(null);
    setMensaje(null);
    setCorreoTocado(true);
    const fallaCorreo = validarCorreo(correo);
    setErrorCorreo(fallaCorreo);
    if (fallaCorreo) {
      document.getElementById('correo')?.focus();
      return;
    }

    setRecuperando(true);
    const { error: errorAuth } = await supabase.auth.resetPasswordForEmail(
      correo.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/cambiar-contrasena` },
    );
    setRecuperando(false);

    if (errorAuth) {
      setError(traducirErrorAuth(errorAuth.message));
      return;
    }
    setMensaje('Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.');
  }

  return (
    <div className="inicio-sesion sistema-theme flex min-h-screen items-center justify-center p-4">
      <div className="aparecer w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
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

        <form onSubmit={manejarEnvio} noValidate className="space-y-5">
          <div>
            <label htmlFor="correo" className="mb-1 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={254}
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                // Tras el primer intento la validación pasa a ser en vivo
                if (correoTocado) setErrorCorreo(validarCorreo(e.target.value));
              }}
              onBlur={() => {
                if (!correo) return; // no molestar si solo pasó por el campo
                setCorreoTocado(true);
                setErrorCorreo(validarCorreo(correo));
              }}
              aria-invalid={errorCorreo ? true : undefined}
              aria-describedby={errorCorreo ? 'error-correo' : undefined}
              placeholder="admin@botica.pe"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                errorCorreo
                  ? 'campo-invalido border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
              }`}
            />
            {errorCorreo && (
              <p
                id="error-correo"
                role="alert"
                className="aparecer mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
              >
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {errorCorreo}
              </p>
            )}
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
                onChange={(e) => {
                  setContrasena(e.target.value);
                  if (e.target.value) setErrorContrasena(null);
                }}
                aria-invalid={errorContrasena ? true : undefined}
                aria-describedby={errorContrasena ? 'error-contrasena' : undefined}
                placeholder="••••••••"
                className={`w-full rounded-lg border py-2.5 pl-3 pr-12 text-sm outline-none transition focus:ring-2 ${
                  errorContrasena
                    ? 'campo-invalido border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
                }`}
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
            {errorContrasena && (
              <p
                id="error-contrasena"
                role="alert"
                className="aparecer mt-1.5 flex items-center gap-1.5 text-xs text-red-600"
              >
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {errorContrasena}
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="aparecer flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
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
          Sistema de Inventario para Boticas
        </p>
      </div>
    </div>
  );
}
