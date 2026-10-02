import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Phone, Plus, Trash2, Truck, User, X } from 'lucide-react';
import type { Proveedor } from '@botica/comun';
import { api } from '../lib/api';
import { Cargando } from '../componentes/ui/Cargando';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { esAdmin } from '../lib/permisos';

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

  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null);
  const [formulario, setFormulario] = useState<FormularioProveedor | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    api
      .get<Proveedor[]>('/proveedores')
      .then(setProveedores)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(cargar, [cargar]);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setGuardando(true);
    setError(null);

    const cuerpo = {
      nombre: formulario.nombre,
      ruc: formulario.ruc || undefined,
      telefono: formulario.telefono || undefined,
      contacto: formulario.contacto || undefined,
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
    if (!confirm(`¿Desactivar al proveedor "${proveedor.nombre}"?`)) return;
    try {
      await api.delete(`/proveedores/${proveedor.id}`);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500">
            Laboratorios y distribuidoras que abastecen a la botica
          </p>
        </div>
        <button
          onClick={() => setFormulario(FORMULARIO_VACIO)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Nuevo proveedor
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!proveedores ? (
        <Cargando mensaje="Cargando proveedores…" />
      ) : proveedores.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <Truck className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            Todavía no hay proveedores registrados.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {proveedores.map((proveedor) => (
            <div
              key={proveedor.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
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
                  <button
                    title="Editar"
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
                  {administrador && (
                    <button
                      title="Desactivar"
                      onClick={() => desactivar(proveedor)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
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
                onClick={() => setFormulario(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
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
                    onChange={(e) => setFormulario({ ...formulario, ruc: e.target.value })}
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
                  onClick={() => setFormulario(null)}
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
    </div>
  );
}
