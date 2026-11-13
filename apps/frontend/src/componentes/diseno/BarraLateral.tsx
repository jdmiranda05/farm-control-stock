import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BellRing,
  Boxes,
  ChevronsLeft,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Pill,
  Settings,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import type { PerfilUsuario } from '@botica/comun';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import {
  esAdmin,
  puedeGestionarInventario,
  puedeVender,
  puedeVerProveedores,
  puedeVerReportes,
} from '../../lib/permisos';

interface Props {
  colapsada: boolean;
  alternar: () => void;
}

interface EnlaceMenu {
  ruta: string;
  etiqueta: string;
  Icono: LucideIcon;
  exacto: boolean;
  /** Qué roles ven este acceso (funciones de src/lib/permisos.ts). */
  visible: (perfil: PerfilUsuario | null) => boolean;
}

interface SeccionMenu {
  titulo: string;
  enlaces: EnlaceMenu[];
}

/** Siempre visible para cualquier usuario autenticado. */
const paraTodos = () => true;

/**
 * Accesos del menú, agrupados en secciones como una barra lateral de Apple
 * (máximo dos niveles). Cada acceso declara qué roles lo ven:
 *   - VENDEDOR   -> caja, catálogo (consulta) y alertas.
 *   - ALMACENERO -> almacén, proveedores, kardex, reportes y alertas.
 *   - ADMIN      -> solo funciones administrativas y de supervisión.
 */
const SECCIONES: SeccionMenu[] = [
  {
    titulo: 'General',
    enlaces: [
      // La pantalla principal de cada rol va primero: Dashboard o Punto de Venta
      { ruta: '/', etiqueta: 'Dashboard', Icono: LayoutDashboard, exacto: true, visible: puedeVerReportes },
      { ruta: '/punto-venta', etiqueta: 'Punto de Venta', Icono: ShoppingCart, exacto: false, visible: puedeVender },
      { ruta: '/alertas', etiqueta: 'Alertas', Icono: BellRing, exacto: false, visible: paraTodos },
    ],
  },
  {
    titulo: 'Operación',
    enlaces: [
      { ruta: '/productos', etiqueta: 'Productos y Categorías', Icono: Pill, exacto: false, visible: paraTodos },
      { ruta: '/inventario', etiqueta: 'Lotes e Inventario', Icono: Boxes, exacto: false, visible: puedeGestionarInventario },
      { ruta: '/proveedores', etiqueta: 'Proveedores', Icono: Truck, exacto: false, visible: puedeVerProveedores },
    ],
  },
  {
    titulo: 'Control',
    enlaces: [
      { ruta: '/kardex', etiqueta: 'Kardex', Icono: ClipboardList, exacto: false, visible: puedeVerReportes },
      { ruta: '/reportes', etiqueta: 'Reporte Diario', Icono: FileBarChart, exacto: false, visible: puedeVerReportes },
      { ruta: '/configuracion', etiqueta: 'Configuración', Icono: Settings, exacto: false, visible: esAdmin },
    ],
  },
];

/**
 * Sidebar FIJA a la izquierda, desplegable.
 * Plegada muestra solo los íconos (w-20); desplegada, ícono + texto (w-64).
 * Los textos y los títulos de sección se desvanecen al ritmo del ancho.
 */
export function BarraLateral({ colapsada, alternar }: Props) {
  const { perfil } = useAutenticacion();
  const secciones = SECCIONES.map((s) => ({
    ...s,
    enlaces: s.enlaces.filter((e) => e.visible(perfil)),
  })).filter((s) => s.enlaces.length > 0);

  return (
    <aside
      className={`menu-lateral fixed z-40 flex flex-col ${colapsada ? 'w-20' : 'w-64'}`}
      aria-label="Menú principal"
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {secciones.map((seccion) => (
          <Fragment key={seccion.titulo}>
            <span className="titulo-seccion-menu" aria-hidden={colapsada}>
              {seccion.titulo}
            </span>
            {seccion.enlaces.map(({ ruta, etiqueta, Icono, exacto }) => (
              <NavLink
                key={ruta}
                to={ruta}
                end={exacto}
                aria-label={etiqueta}
                title={colapsada ? etiqueta : undefined}
                className="flex items-center gap-3 px-3 py-2"
              >
                <Icono className="h-[19px] w-[19px] shrink-0" strokeWidth={2} />
                <span className="texto-menu">{etiqueta}</span>
              </NavLink>
            ))}
          </Fragment>
        ))}
      </nav>

      {/* Botón plegar / desplegar */}
      <button
        onClick={alternar}
        aria-label={colapsada ? 'Expandir menú' : 'Colapsar menú'}
        aria-expanded={!colapsada}
        title={colapsada ? 'Expandir menú' : 'Colapsar menú'}
        className="alternar-menu flex items-center justify-center gap-2 py-2.5 hover:bg-black/5"
      >
        <ChevronsLeft className="icono-alternar h-[18px] w-[18px] shrink-0" />
        <span className="texto-menu">Colapsar menú</span>
      </button>
    </aside>
  );
}
