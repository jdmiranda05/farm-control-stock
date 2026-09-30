import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { supabaseConfigurado } from './lib/supabase';
import './estilos/global.css';

/**
 * Pantalla de ayuda que se muestra si aún no se configuró el archivo .env
 * (evita una pantalla en blanco difícil de diagnosticar en la demo).
 */
function AvisoConfiguracion() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <div className="max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-gray-900">⚙️ Falta configurar Supabase</h1>
        <p className="mt-3 text-sm text-gray-600">
          Para iniciar la aplicación complete las variables de entorno del frontend:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            Copie <code className="rounded bg-gray-100 px-1.5 py-0.5">apps/frontend/.env.ejemplo</code>{' '}
            como <code className="rounded bg-gray-100 px-1.5 py-0.5">apps/frontend/.env</code>
          </li>
          <li>
            Complete <code className="rounded bg-gray-100 px-1.5 py-0.5">VITE_SUPABASE_URL</code> y{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code>{' '}
            (Supabase → Project Settings → API)
          </li>
          <li>Reinicie el servidor de desarrollo (<code className="rounded bg-gray-100 px-1.5 py-0.5">pnpm dev</code>)</li>
        </ol>
        <p className="mt-4 text-xs text-gray-400">
          Encontrará la guía completa en el README.md del proyecto.
        </p>
      </div>
    </div>
  );
}

// Punto de entrada: monta la aplicación React en el <div id="raiz"> del index.html
createRoot(document.getElementById('raiz')!).render(
  <StrictMode>{supabaseConfigurado ? <App /> : <AvisoConfiguracion />}</StrictMode>,
);
