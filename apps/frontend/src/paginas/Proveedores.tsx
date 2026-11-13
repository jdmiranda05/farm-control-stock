import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArchiveRestore, EyeOff, Pencil, Phone, Plus, RotateCcw, Truck, User, X } from 'lucide-react';
import type { Proveedor } from '@botica/comun';
import { api } from '../lib/api';
import { EsqueletoProveedores } from '../componentes/ui/Esqueleto';
import { useConfirmacion } from '../componentes/ui/DialogoConfirmacion';
import { ControlSegmentado } from '../componentes/ui/ControlSegmentado';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { esAdmin, puedeEditarProveedores } from '../lib/permisos';

/** Estado del formulario del modal (crear o editar proveedor). */
interface FormularioProveedor {
  id?: string;
  nombre: string;
  ruc: string;
  telefono: string;
  contacto: string;
}

const FORMULARIO_VACIO: FormularioProveedor = {
  nombre: '',
  ruc: '',
  telefono: '',
  contacto: '',
};

/**
 * Pantalla de Proveedores (laboratorios y distribuidoras).
 * Relacionar cada lote con su proveedor permite rastrear el origen de un
 * medicamento vencido o dañado y reclamar al distribuidor correspondiente.
 */
export function Proveedores() {
  const { perfil } = useAutenticacion();
  const administrador = esAdmin(perfil);
  const puedeEditar = puedeEditarProveedores(perfil);

  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null);
  const [formulario, setFormulario] = useState<FormularioProveedor | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [vista, setVista] = useState<'activos' | 'inactivos'>('activos');
  const { confirmar, dialogo } = useConfirmacion();

  const cargar = useCallback(() => {
    // El ADMIN también ve los dados de baja, para poder reactivarlos
    api
      .get<Proveedor[]>(`/proveedores${administrador ? '?incluirInactivos=true' : ''}`)
      .then(setProveedores)
      .catch((e: Error) => {
        setError(e.message);
        setProveedores((actual) => actual ?? []);
      });
  }, [administrador]);

  useEffect(cargar, [cargar]);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setError(null);

    const ruc = formulario.ruc.trim();
    const telefono = formulario.telefono.trim();
    if (!formulario.nombre.trim()) {
      setError('El nombre del proveedor es obligatorio');
      return;
    }
    if (ruc && !/^(10|15|17|20)\d{9}$/.test(ruc)) {
      setError('El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20');
      return;
    }
    if (telefono && !/^[0-9+()\s-]{6,20}$/.test(telefono)) {
      setError('El teléfono solo puede contener números, espacios, +, - y ()');
      return;
    }
    setGuardando(true);

    const cuerpo = {
      nombre: formulario.nombre.trim(),
      ruc: ruc || undefined,
      telefono: telefono || undefined,
      contacto: formulario.contacto.trim() || undefined,
    };

    try {
      if (formulario.id) await api.patch(`/proveedores/${formulario.id}`, cuerpo);
      else await api.post('/proveedores', cuerpo);
      setFormulario(null);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(proveedor: Proveedor) {
    const confirmado = await confirmar({
      titulo: `¿Dar de baja a "${proveedor.nombre}"?`,
      mensaje:
        'Ya no podrá elegirse al registrar entradas. Los lotes que entregó conservan la referencia y puede reactivarlo cuando quiera.',
      accion: 'Dar de baja',
      tono: 'neutro',
      Icono: EyeOff,
      alConfirmar: async () => {
        await api.delete(`/proveedores/${proveedor.id}`);
      },
    });
    if (!confirmado) return;
    setMensaje(`Proveedor "${proveedor.nombre}" dado de baja.`);
    cargar();
  }

  async function reactivar(proveedor: Proveedor) {
    const confirmado = await confirmar({
      titulo: `¿Reactivar a "${proveedor.nombre}"?`,
      mensaje: 'Volverá a estar disponible al registrar entradas de mercadería.',
      accion: 'Reactivar',
      tono: 'exito',
      Icono: ArchiveRestore,
      alConfirmar: async () => {
        await api.patch(`/proveedores/${proveedor.id}/reactivar`);
      },
    });
    if (!confirmado) return;
    setMensaje(`Proveedor "${proveedor.nombre}" reactivado.`);
    cargar();
  }

  if (!proveedores) return <EsqueletoProveedores />;

  const activos = proveedores.filter((p) => p.activo !== false);
  const inactivos = proveedores.filter((p) => p.activo === false);
  const visibles = vista === 'activos' ? activos : inactivos;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500">
            {puedeEditar
              ? 'Laboratorios y distribuidoras que abastecen a la botica'
              : 'Directorio de consulta. Los proveedores los registra el administrador'}
          </p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setFormulario(FORMULARIO_VACIO)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </button>
        )}
      </div>

      {administrador && (
        <ControlSegmentado
          etiquetaAccesible="Estado de los proveedores"
          className="w-full max-w-sm"
          valor={vista}
          alCambiar={setVista}
          opciones={[
            { valor: 'activos', etiqueta: `Activos (${activos.length})` },
            { valor: 'inactivos', etiqueta: `Dados de baja (${inactivos.length})` },
          ]}
        />
      )}

      {mensaje && (
        <p role="status" className="aparecer rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {mensaje}
        </p>
      )}
      {error && !formulario && (
        <p className="aparecer rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {visibles.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <Truck className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            {vista === 'inactivos'
              ? 'No hay proveedores dados de baja.'
              : 'Todavía no hay proveedores registrados.'}
          </p>
        </div>
      ) : (
        <div key={vista} className="lista-animada grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((proveedor) => (
            <div
              key={proveedor.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Truck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{proveedor.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {proveedor.ruc ? `RUC ${proveedor.ruc}` : 'Sin RUC registrado'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  {puedeEditar && (
                  <button
                    title="Editar"
                    aria-label={`Editar ${proveedor.nombre}`}
                    onClick={() =>
                      setFormulario({
                        id: proveedor.id,
                        nombre: proveedor.nombre,
                        ruc: proveedor.ruc ?? '',
                        telefono: proveedor.telefono ?? '',
                        contacto: proveedor.contacto ?? '',
                      })
                    }
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  )}
                  {administrador && proveedor.activo !== false && (
                    <button
                      title="Dar de baja"
                      aria-label={`Dar de baja a ${proveedor.nombre}`}
                      onClick={() => desactivar(proveedor)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  )}
                  {administrador && proveedor.activo === false && (
                    <button
                      onClick={() => reactivar(proveedor)}
                      className="boton-primario flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reactivar
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                {proveedor.contacto && (
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {proveedor.contacto}
                  </p>
                )}
                {proveedor.telefono && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {proveedor.telefono}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de crear / editar */}
      {formulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {formulario.id ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h2>
              <button
                onClick={() => {
                  setFormulario(null);
                  setError(null);
                }}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardar} noValidate className="space-y-4">
              {error && (
                <p role="alert" className="aparecer rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Nombre o razón social *
                </label>
                <input
                  required
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                  placeholder="Droguería Farmacéutica del Norte S.A.C."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">RUC</label>
                  <input
                    value={formulario.ruc}
                    inputMode="numeric"
                    onChange={(e) =>
                      setFormulario({ ...formulario, ruc: e.target.value.replace(/\D/g, '') })
                    }
                    maxLength={11}
                    placeholder="20456789123"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Teléfono</label>
                  <input
                    value={formulario.telefono}
                    onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                    placeholder="01-444-7788"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Persona de contacto
                </label>
                <input
                  value={formulario.contacto}
                  onChange={(e) => setFormulario({ ...formulario, contacto: e.target.value })}
                  placeholder="Carlos Mendoza"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormulario(null);
                    setError(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {guardando ? 'Guardando…' : formulario.id ? 'Guardar cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {dialogo}
    </div>
  );
}
