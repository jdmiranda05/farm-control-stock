import { NavLink } from 'react-router-dom';
import {
  BellRing,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Cross,
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

/** Siempre visible para cualquier usuario autenticado. */
const paraTodos = () => true;

/**
 * Accesos del menú. Cada uno declara quién puede verlo, de modo que la
 * navegación se adapta al rol: el vendedor ve una interfaz simple centrada
 * en la caja, mientras que el administrador ve el sistema completo.
 */
const ENLACES: EnlaceMenu[] = [
  {
    ruta: '/',
    etiqueta: 'Dashboard',
    Icono: LayoutDashboard,
    exacto: true,
    visible: puedeVerReportes,
  },
  {
    ruta: '/punto-venta',
    etiqueta: 'Punto de Venta',
    Icono: ShoppingCart,
    exacto: false,
    visible: puedeVender,
  },
  {
    ruta: '/productos',
    etiqueta: 'Productos y Categorías',
    Icono: Pill,
    exacto: false,
    visible: paraTodos,
  },
  {
    ruta: '/inventario',
    etiqueta: 'Lotes e Inventario',
    Icono: Boxes,
    exacto: false,
    visible: puedeGestionarInventario,
  },
  {
    ruta: '/proveedores',
    etiqueta: 'Proveedores',
    Icono: Truck,
    exacto: false,
    visible: puedeGestionarInventario,
  },
  {
    ruta: '/kardex',
    etiqueta: 'Kardex',
    Icono: ClipboardList,
    exacto: false,
    visible: puedeVerReportes,
  },
  {
    ruta: '/reportes',
    etiqueta: 'Reporte Diario',
    Icono: ClipboardList,
    exacto: false,
    visible: puedeVerReportes,
  },
  {
    ruta: '/alertas',
    etiqueta: 'Alertas',
    Icono: BellRing,
    exacto: false,
    visible: paraTodos,
  },
  {
    ruta: '/configuracion',
    etiqueta: 'Configuración',
    Icono: Settings,
    exacto: false,
    visible: esAdmin,
  },
];

/**
 * Sidebar FIJA a la izquierda, colapsable.
 * Colapsada muestra solo los íconos (w-20); expandida, ícono + texto (w-64).
 */
export function BarraLateral({ colapsada, alternar }: Props) {
  const { perfil } = useAutenticacion();
  const enlacesVisibles = ENLACES.filter((enlace) => enlace.visible(perfil));

  return (
    <aside
      className={`menu-lateral fixed z-40 flex flex-col ${
        colapsada ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logotipo del sistema */}
      <div className="marca-lateral flex h-16 items-center gap-3 px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white">
          <Cross className="h-5 w-5" />
        </span>
        {!colapsada && (
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">Botica SaaS</p>
            <p className="text-[11px] text-slate-400">Inventario y Ventas</p>
          </div>
        )}
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {enlacesVisibles.map(({ ruta, etiqueta, Icono, exacto }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={exacto}
            aria-label={etiqueta}
            title={etiqueta}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-700'
              } ${colapsada ? 'justify-center' : ''}`
            }
          >
            <Icono className="h-5 w-5 shrink-0" />
            {!colapsada && <span className="truncate">{etiqueta}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Botón colapsar / expandir */}
      <button
        onClick={alternar}
        aria-label={colapsada ? 'Expandir menú' : 'Colapsar menú'}
        className="alternar-menu flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:bg-gray-100 hover:text-emerald-700"
      >
        {colapsada ? (
          <ChevronsRight className="h-5 w-5" />
        ) : (
          <>
            <ChevronsLeft className="h-5 w-5" />
            <span>Colapsar menú</span>
          </>
        )}
      </button>
    </aside>
  );
}
