import type { ReactNode } from 'react';

/**
 * Esqueletos de carga ("skeleton screens").
 *
 * En lugar de un spinner, mientras llegan los datos se dibuja la silueta de
 * la pantalla con bloques grises animados. El usuario percibe la carga como
 * más rápida y la página no "salta" cuando aparecen los datos reales.
 */

interface PropsBloque {
  className?: string;
}

/** Bloque base con brillo animado (ver .esqueleto en global.css). */
export function Esqueleto({ className = '' }: PropsBloque) {
  return <span aria-hidden="true" className={`esqueleto block ${className}`} />;
}

/** Contenedor accesible: anuncia la carga a lectores de pantalla. */
function Contenedor({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="aparecer space-y-6">
      <span className="sr-only">{etiqueta}</span>
      {children}
    </div>
  );
}

/** Título + subtítulo de página, con botón de acción opcional. */
export function EsqueletoEncabezado({ conBoton = false }: { conBoton?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-3">
        <Esqueleto className="h-8 w-64 max-w-[70vw] rounded-xl" />
        <Esqueleto className="h-4 w-96 max-w-[80vw]" />
      </div>
      {conBoton && <Esqueleto className="h-10 w-40 rounded-full" />}
    </div>
  );
}

/** Tabla con cabecera y N filas. */
export function EsqueletoTabla({
  filas = 6,
  columnas = 5,
  conTitulo = false,
}: {
  filas?: number;
  columnas?: number;
  conTitulo?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {conTitulo && (
        <div className="space-y-2 border-b border-gray-100 px-5 py-4">
          <Esqueleto className="h-5 w-56" />
          <Esqueleto className="h-3 w-80 max-w-full" />
        </div>
      )}
      <div className="flex gap-6 bg-[#f7f8f5] px-5 py-4">
        {Array.from({ length: columnas }).map((_, i) => (
          <Esqueleto key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: filas }).map((_, fila) => (
          <div key={fila} className="flex items-center gap-6 px-5 py-4">
            {Array.from({ length: columnas }).map((_, col) => (
              <div key={col} className="flex-1 space-y-2">
                <Esqueleto
                  className={`h-4 ${col === 0 ? 'w-4/5' : col % 2 ? 'w-3/5' : 'w-2/3'}`}
                />
                {col === 0 && <Esqueleto className="h-3 w-2/5" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rejilla de tarjetas KPI. */
export function EsqueletoTarjetas({ cantidad = 6 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div
          key={i}
          className="tarjeta-kpi rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              <Esqueleto className="h-4 w-32" />
              <Esqueleto className="h-8 w-28 rounded-lg" />
              <Esqueleto className="h-3 w-44 max-w-full" />
            </div>
            <Esqueleto className="h-10 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista de elementos (alertas, resultados de búsqueda…). */
export function EsqueletoLista({ elementos = 5 }: { elementos?: number }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: elementos }).map((_, i) => (
        <li
          key={i}
          className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <Esqueleto className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Esqueleto className="h-3 w-28" />
            <Esqueleto className="h-4 w-11/12" />
            <Esqueleto className="h-3 w-36" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Formulario dentro de una tarjeta. */
export function EsqueletoFormulario({ campos = 4 }: { campos?: number }) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Esqueleto className="h-8 w-8 rounded-lg" />
        <Esqueleto className="h-5 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: campos }).map((_, i) => (
          <div key={i} className={`space-y-2 ${i === 0 ? 'col-span-2' : ''}`}>
            <Esqueleto className="h-3 w-24" />
            <Esqueleto className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Esqueleto className="h-10 w-full rounded-full" />
    </div>
  );
}

/** Rejilla de tarjetas simples (proveedores). */
export function EsqueletoTarjetasSimples({ cantidad = 6 }: { cantidad?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Esqueleto className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Esqueleto className="h-4 w-3/4" />
              <Esqueleto className="h-3 w-1/2" />
            </div>
          </div>
          <Esqueleto className="h-3 w-2/3" />
          <Esqueleto className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  Esqueletos de página completos (uno por pantalla)
// ════════════════════════════════════════════════════════════════

export function EsqueletoPanel() {
  return (
    <Contenedor etiqueta="Cargando métricas…">
      <EsqueletoEncabezado />
      <EsqueletoTarjetas cantidad={6} />
      <EsqueletoTabla filas={5} columnas={6} conTitulo />
    </Contenedor>
  );
}

export function EsqueletoPuntoVenta() {
  return (
    <Contenedor etiqueta="Cargando catálogo…">
      <EsqueletoEncabezado />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Esqueleto className="h-3 w-32" />
            <div className="grid grid-cols-2 gap-3">
              <Esqueleto className="h-12 rounded-lg" />
              <Esqueleto className="h-12 rounded-lg" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <Esqueleto className="h-10 w-full rounded-xl" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex-1 space-y-2">
                  <Esqueleto className="h-4 w-1/2" />
                  <Esqueleto className="h-3 w-1/3" />
                </div>
                <Esqueleto className="h-4 w-16" />
                <Esqueleto className="h-8 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <Esqueleto className="h-5 w-40" />
          <Esqueleto className="h-24 w-full rounded-lg" />
          <Esqueleto className="h-8 w-full" />
          <Esqueleto className="h-12 w-full rounded-full" />
        </div>
      </div>
    </Contenedor>
  );
}

export function EsqueletoProductos() {
  return (
    <Contenedor etiqueta="Cargando catálogo…">
      <EsqueletoEncabezado conBoton />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Esqueleto className="h-4 w-24" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Esqueleto key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <EsqueletoTabla filas={7} columnas={6} />
    </Contenedor>
  );
}

export function EsqueletoInventario() {
  return (
    <Contenedor etiqueta="Cargando inventario…">
      <EsqueletoEncabezado />
      <div className="grid gap-6 lg:grid-cols-2">
        <EsqueletoFormulario campos={6} />
        <EsqueletoFormulario campos={4} />
      </div>
      <EsqueletoTabla filas={6} columnas={7} conTitulo />
    </Contenedor>
  );
}

export function EsqueletoProveedores() {
  return (
    <Contenedor etiqueta="Cargando proveedores…">
      <EsqueletoEncabezado conBoton />
      <EsqueletoTarjetasSimples />
    </Contenedor>
  );
}

export function EsqueletoAlertas() {
  return (
    <Contenedor etiqueta="Actualizando alertas…">
      <EsqueletoEncabezado />
      <div className="flex gap-3">
        <Esqueleto className="h-10 w-44 rounded-xl" />
        <Esqueleto className="h-10 w-44 rounded-xl" />
      </div>
      <EsqueletoLista />
    </Contenedor>
  );
}

export function EsqueletoKardex() {
  return (
    <Contenedor etiqueta="Cargando historial…">
      <EsqueletoEncabezado />
      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <Esqueleto key={i} className="h-10 w-40 rounded-xl" />
        ))}
      </div>
      <EsqueletoTabla filas={8} columnas={6} />
    </Contenedor>
  );
}

export function EsqueletoReporte() {
  return (
    <Contenedor etiqueta="Generando reporte…">
      <EsqueletoEncabezado conBoton />
      <EsqueletoTarjetas cantidad={3} />
      <EsqueletoTabla filas={6} columnas={6} conTitulo />
    </Contenedor>
  );
}

export function EsqueletoUsuarios() {
  return (
    <Contenedor etiqueta="Cargando usuarios…">
      <EsqueletoEncabezado conBoton />
      <Esqueleto className="h-10 w-80 max-w-full rounded-xl" />
      <EsqueletoTabla filas={5} columnas={4} />
    </Contenedor>
  );
}

export function EsqueletoConfiguracion() {
  return (
    <Contenedor etiqueta="Cargando configuración…">
      <EsqueletoEncabezado />
      <div className="max-w-2xl">
        <EsqueletoFormulario campos={5} />
      </div>
    </Contenedor>
  );
}

/** Pantalla completa mientras se verifica la sesión (layout + contenido). */
export function EsqueletoSistema() {
  return (
    <div className="sistema-theme disposicion-principal" role="status" aria-busy="true">
      <span className="sr-only">Verificando sesión…</span>
      <div className="encabezado-sistema flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <Esqueleto className="h-10 w-10 rounded-full" />
          <Esqueleto className="hidden h-5 w-32 sm:block" />
        </div>
        <Esqueleto className="h-10 w-56 max-w-[40vw] rounded-full" />
        <div className="flex items-center gap-3">
          <Esqueleto className="h-9 w-9 rounded-full" />
          <Esqueleto className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="menu-lateral fixed z-40 flex w-20 flex-col items-center gap-3 px-3 py-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Esqueleto key={i} className="h-11 w-11 rounded-full" />
        ))}
      </div>
      <div className="contenido-sistema menu-compacto flex flex-col">
        <main className="contenido-pagina flex-1">
          <EsqueletoPanel />
        </main>
      </div>
    </div>
  );
}
