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
 *  │  a la      │                              │
 *  │  izquierda │   Contenido de la página     │
 *  │ (colapsa)  │   (<Outlet /> del router)    │
 *  │            │                              │
 *  └────────────┴──────────────────────────────┘
 *
 * El menú y el contenido ocupan columnas de la misma cuadrícula.
 */
export function DisposicionPrincipal() {
  const [colapsada, setColapsada] = useState(true);
  const { pathname } = useLocation();

  return (
    <div className={`sistema-theme disposicion-principal ${colapsada ? '' : 'menu-amplio'}`}>
      <Encabezado />
      <BarraLateral colapsada={colapsada} alternar={() => setColapsada((v) => !v)} />

      <div className="contenido-sistema flex flex-col">
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
