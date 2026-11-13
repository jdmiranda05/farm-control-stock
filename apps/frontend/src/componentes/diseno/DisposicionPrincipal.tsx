import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BarraLateral } from './BarraLateral';
import { Encabezado } from './Encabezado';

/**
 * Layout principal de la zona privada (requisito de navegación):
 *
 *  ┌────────────┬──────────────────────────────┐
 *  │            │  Encabezado sin scroll      │
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
  const [colapsada, setColapsada] = useState(true);
  const { pathname } = useLocation();

  return (
    <div className="sistema-theme disposicion-principal">
      <Encabezado />
      <BarraLateral colapsada={colapsada} alternar={() => setColapsada((v) => !v)} />

      {/* El margen izquierdo sigue el ancho de la sidebar (w-64 ↔ w-20) */}
      <div
        className={`contenido-sistema flex flex-col ${
          colapsada ? 'menu-compacto' : 'menu-amplio'
        }`}
      >
        <main className="contenido-pagina flex-1">
          {/* La clave por ruta reinicia la animación de entrada en cada página */}
          <div key={pathname} className="transicion-pagina">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
