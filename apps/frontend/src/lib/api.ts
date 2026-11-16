import { supabase } from './supabase';

/**
 * Cliente HTTP hacia la API NestJS.
 * En cada petición adjunta el JWT de la sesión de Supabase Auth como
 * `Authorization: Bearer <token>`; el backend lo valida en GuardiaAutenticacion.
 */

const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  // 1) Obtener el token de la sesión activa (si existe)
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  // 2) Ejecutar la petición con los encabezados adecuados
  const respuesta = await fetch(`${URL_API}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opciones.headers ?? {}),
    },
  });

  // 3) Traducir errores HTTP a excepciones legibles.
  //    NestJS devuelve { message: string | string[] } en los errores.
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    const mensaje = Array.isArray(cuerpo?.message)
      ? cuerpo.message.join(' · ')
      : (cuerpo?.message ?? `Error ${respuesta.status} al llamar a la API`);
    throw new Error(mensaje);
  }

  return respuesta.json() as Promise<T>;
}

/**
 * Descarga un archivo generado por la API (ej. un Excel) y lo guarda en el
 * equipo con el nombre que indique el servidor (cabecera Content-Disposition).
 */
async function descargar(ruta: string, nombrePorDefecto: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const respuesta = await fetch(`${URL_API}${ruta}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    const mensaje = Array.isArray(cuerpo?.message)
      ? cuerpo.message.join(' · ')
      : (cuerpo?.message ?? `Error ${respuesta.status} al descargar el archivo`);
    throw new Error(mensaje);
  }

  const disposicion = respuesta.headers.get('Content-Disposition') ?? '';
  const nombre = /filename="?([^";]+)"?/i.exec(disposicion)?.[1] ?? nombrePorDefecto;
  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Métodos abreviados: api.get, api.post, api.patch, api.delete, api.descargar */
export const api = {
  get: <T>(ruta: string) => peticion<T>(ruta),
  post: <T>(ruta: string, cuerpo?: unknown) =>
    peticion<T>(ruta, { method: 'POST', body: JSON.stringify(cuerpo ?? {}) }),
  patch: <T>(ruta: string, cuerpo?: unknown) =>
    peticion<T>(ruta, { method: 'PATCH', body: JSON.stringify(cuerpo ?? {}) }),
  delete: <T>(ruta: string) => peticion<T>(ruta, { method: 'DELETE' }),
  descargar,
};
