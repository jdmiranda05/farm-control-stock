import { useEffect, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import type { Botica } from '@botica/comun';
import { api } from '../lib/api';
import { Cargando } from '../componentes/ui/Cargando';

/**
 * Página "Configuración de la Botica".
 * Aquí se parametriza `diasAlertaVencimiento`, el rango que usa el motor
 * de alertas para avisar vencimientos próximos (ej. 30 o 60 días).
 * El enrutador ya restringe esta pantalla al rol ADMIN (RutaPorRol) y el
 * backend vuelve a verificarlo con @Roles(RolUsuario.ADMIN).
 */
export function Configuracion() {
  const [botica, setBotica] = useState<Botica | null>(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    diasAlertaVencimiento: '30',
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Botica>('/boticas/mia')
      .then((datos) => {
        setBotica(datos);
        setFormulario({
          nombre: datos.nombre,
          ruc: datos.ruc ?? '',
          direccion: datos.direccion ?? '',
          telefono: datos.telefono ?? '',
          diasAlertaVencimiento: String(datos.dias_alerta_vencimiento),
        });
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setError(null);
    try {
      const actualizada = await api.patch<Botica>('/boticas/mia', {
        nombre: formulario.nombre,
        ruc: formulario.ruc || undefined,
        direccion: formulario.direccion || undefined,
        telefono: formulario.telefono || undefined,
        diasAlertaVencimiento: Number(formulario.diasAlertaVencimiento),
      });
      setBotica(actualizada);
      setMensaje('Configuración guardada correctamente.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  if (error && !botica) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }
  if (!botica) return <Cargando mensaje="Cargando configuración…" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de la Botica</h1>
        <p className="text-sm text-gray-500">Datos generales y parámetros del sistema de alertas</p>
      </div>

      <form onSubmit={guardar} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nombre de la botica *</label>
          <input
            required
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">RUC</label>
            <input
                value={formulario.ruc}
              onChange={(e) => setFormulario({ ...formulario, ruc: e.target.value })}
              placeholder="20123456789"
              maxLength={11}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
            <input
                value={formulario.telefono}
              onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Dirección</label>
          <input
            value={formulario.direccion}
            onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            Días de anticipación para alertas de vencimiento *
          </label>
          <p className="mb-3 text-xs text-gray-500">
            El motor de alertas marcará "Vencimiento próximo" todo lote al que le falten
            estos días (o menos) para vencer. Valores típicos: 30, 60 o 90.
          </p>
          <input
            required
            type="number"
            min="1"
            max="365"
            value={formulario.diasAlertaVencimiento}
            onChange={(e) =>
              setFormulario({ ...formulario, diasAlertaVencimiento: e.target.value })
            }
            className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {mensaje && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</p>
        )}
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <button
            type="submit"
          disabled={guardando}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
          <Save className="h-4 w-4" />
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
