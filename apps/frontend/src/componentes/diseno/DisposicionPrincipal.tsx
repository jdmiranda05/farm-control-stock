import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BarraLateral } from './BarraLateral';
import { Encabezado } from './Encabezado';

/**
 * Layout principal de la zona privada (requisito de navegación):
 *
 *  ┌────────────┬──────────────────────────────┐
 *  │            │  Encabezado (header sticky)  │
 *  │  Sidebar   ├──────────────────────────────┤
 *  │  fija a    │                              │
 *  │  la izq.   │   Contenido de la página     │
 *  │ (colapsa)  │   (<Outlet /> del router)    │
 *  │            │                              │
 *  └────────────┴──────────────────────────────┘
 *
 * La sidebar es `fixed`; el contenido compensa su ancho con margin-left,
 * que cambia junto con el estado colapsada/expandida.
 */
export function DisposicionPrincipal() {
  const [colapsada, setColapsada] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <BarraLateral colapsada={colapsada} alternar={() => setColapsada((v) => !v)} />

      {/* El margen izquierdo sigue el ancho de la sidebar (w-64 ↔ w-20) */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          colapsada ? 'ml-20' : 'ml-64'
        }`}
      >
        <Encabezado />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
