import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase para el FRONTEND.
 * Usa la clave pública `anon`: solo sirve para autenticarse (Supabase Auth)
 * y para consultas limitadas por las políticas RLS.
 * Los datos de negocio se piden SIEMPRE a la API NestJS (ver lib/api.ts).
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const claveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Indica si el archivo .env ya fue configurado con valores reales.
 * (Se detecta también el marcador "TU-PROYECTO" del .env.ejemplo.)
 * Si es falso, main.tsx muestra una pantalla de ayuda en lugar de la app.
 */
export const supabaseConfigurado = Boolean(
  url && claveAnon && !url.includes('TU-PROYECTO'),
);

// Con valores de relleno el cliente se crea sin errores y la aplicación
// puede montarse para mostrar el aviso de configuración pendiente.
export const supabase = createClient(
  supabaseConfigurado ? url : 'https://sin-configurar.supabase.co',
  supabaseConfigurado ? claveAnon : 'clave-sin-configurar',
);
