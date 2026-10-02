import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Configuración de Vite: plugin de React + Tailwind CSS v4 (sin archivo
// tailwind.config: el plugin escanea las clases automáticamente).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // El frontend consume el CÓDIGO FUENTE TypeScript del paquete común
      // (Vite lo transpila al vuelo); el backend usa la versión compilada.
      '@botica/comun': fileURLToPath(
        new URL('../../packages/comun/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
  },
});
