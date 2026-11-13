import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorAutenticacion, useAutenticacion } from './contexto/ContextoAutenticacion';
import { RutaProtegida } from './componentes/diseno/RutaProtegida';
import { RutaPorRol } from './componentes/diseno/RutaPorRol';
import { DisposicionPrincipal } from './componentes/diseno/DisposicionPrincipal';
import { InicioSesion } from './paginas/InicioSesion';
import { CambiarContrasena } from './paginas/CambiarContrasena';
import { PanelControl } from './paginas/PanelControl';
import { PuntoVenta } from './paginas/PuntoVenta';
import { Productos } from './paginas/Productos';
import { Inventario } from './paginas/Inventario';
import { Proveedores } from './paginas/Proveedores';
import { Kardex } from './paginas/Kardex';
import { ReporteDiario } from './paginas/ReporteDiario';
import { Alertas } from './paginas/Alertas';
import { Configuracion } from './paginas/Configuracion';
import { Usuarios } from './paginas/Usuarios';
import {
  esAdmin,
  puedeGestionarInventario,
  puedeVender,
  puedeVerProveedores,
  puedeVerReportes,
} from './lib/permisos';

/**
 * Pantalla de inicio según el rol:
 *   - VENDEDOR -> va directo al punto de venta, que es su herramienta de trabajo
 *   - ADMIN y ALMACENERO -> ven el panel de control con los indicadores
 */
function PaginaInicial() {
  const { perfil } = useAutenticacion();
  if (perfil && !puedeVerReportes(perfil)) return <Navigate to="/punto-venta" replace />;
  return <PanelControl />;
}

/**
 * Enrutador principal.
 * Todas las páginas internas cuelgan de DisposicionPrincipal (sidebar fija +
 * header) y están protegidas por RutaProtegida (sesión) y, cuando
 * corresponde, por RutaPorRol (permisos).
 */
export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAutenticacion>
        <Routes>
          {/* Página pública de inicio de sesión */}
          <Route path="/inicio-sesion" element={<InicioSesion />} />
          <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />

          {/* Zona privada: exige sesión activa */}
          <Route
            path="/"
            element={
              <RutaProtegida>
                <DisposicionPrincipal />
              </RutaProtegida>
            }
          >
            <Route index element={<PaginaInicial />} />

            {/* Punto de venta: solo VENDEDOR */}
            <Route
              path="punto-venta"
              element={
                <RutaPorRol permitido={puedeVender}>
                  <PuntoVenta />
                </RutaPorRol>
              }
            />

            {/* Catálogo: lo consultan todos los roles (el vendedor ve stock) */}
            <Route path="productos" element={<Productos />} />

            {/* Almacén: solo ALMACENERO */}
            <Route
              path="inventario"
              element={
                <RutaPorRol permitido={puedeGestionarInventario}>
                  <Inventario />
                </RutaPorRol>
              }
            />
            {/* Proveedores: ALMACENERO los gestiona; ADMIN consulta y da de baja */}
            <Route
              path="proveedores"
              element={
                <RutaPorRol permitido={puedeVerProveedores}>
                  <Proveedores />
                </RutaPorRol>
              }
            />

            {/* Kardex y reportes: ALMACENERO y ADMIN */}
            <Route
              path="kardex"
              element={
                <RutaPorRol permitido={puedeVerReportes}>
                  <Kardex />
                </RutaPorRol>
              }
            />
            <Route
              path="reportes"
              element={
                <RutaPorRol permitido={puedeVerReportes}>
                  <ReporteDiario />
                </RutaPorRol>
              }
            />

            <Route path="alertas" element={<Alertas />} />

            {/* Usuarios: el ADMIN crea almaceneros y vendedores */}
            <Route
              path="usuarios"
              element={
                <RutaPorRol permitido={esAdmin}>
                  <Usuarios />
                </RutaPorRol>
              }
            />

            {/* Configuración: solo ADMIN */}
            <Route
              path="configuracion"
              element={
                <RutaPorRol permitido={esAdmin}>
                  <Configuracion />
                </RutaPorRol>
              }
            />
          </Route>

          {/* Cualquier otra ruta vuelve al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProveedorAutenticacion>
    </BrowserRouter>
  );
}
