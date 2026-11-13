import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Boxes,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  TriangleAlert,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { RolUsuario, esCorreoValido, type Usuario } from '@botica/comun';
import { api } from '../lib/api';
import { NOMBRE_ROL } from '../lib/permisos';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { EsqueletoUsuarios } from '../componentes/ui/Esqueleto';
import { ControlSegmentado } from '../componentes/ui/ControlSegmentado';
import { useConfirmacion } from '../componentes/ui/DialogoConfirmacion';

type RolAsignable = RolUsuario.ALMACENERO | RolUsuario.VENDEDOR;

/** Lo que hace cada rol, para que el ADMIN elija con conocimiento. */
const DESCRIPCION_ROL: Record<RolAsignable, { texto: string; Icono: typeof Boxes }> = {
  [RolUsuario.ALMACENERO]: { texto: 'Recibe mercadería, controla lotes y registra mermas', Icono: Boxes },
  [RolUsuario.VENDEDOR]: { texto: 'Atiende el punto de venta y consulta el stock', Icono: ShoppingCart },
};

const PATRON_CONTRASENA = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const PATRON_NOMBRE = /^[\p{L} .'-]+$/u;

/**
 * Contraseña temporal legible (sin caracteres confusos como 0/O o 1/l):
 * 4 letras + 4 números + 2 letras, ej. "Kavu-4827-Tm".
 */
function generarContrasena(): string {
  const letras = 'abcdefghjkmnpqrstuvwxyz';
  const numeros = '23456789';
  const azar = (fuente: string, n: number) => {
    const valores = crypto.getRandomValues(new Uint32Array(n));
    return Array.from(valores, (v) => fuente[v % fuente.length]).join('');
  };
  const palabra = azar(letras, 4);
  return `${palabra[0].toUpperCase()}${palabra.slice(1)}-${azar(numeros, 4)}-${azar(letras, 2).toUpperCase()}`;
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

interface FormularioUsuario {
  id?: string;
  nombreCompleto: string;
  correo: string;
  rol: RolAsignable;
  contrasena: string;
}

/** Credenciales recién creadas o restablecidas, para entregarlas al usuario. */
interface Credenciales {
  nombre: string;
  correo: string;
  contrasena: string;
  titulo: string;
}

/**
 * Pantalla "Usuarios" (solo ADMIN): el administrador da de alta a los
 * almaceneros y vendedores de su botica, cambia su rol, les quita o
 * devuelve el acceso y restablece su contraseña.
 */
export function Usuarios() {
  const { perfil } = useAutenticacion();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [filtro, setFiltro] = useState<'todos' | RolAsignable | 'inactivos'>('todos');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formulario, setFormulario] = useState<FormularioUsuario | null>(null);
  const [erroresFormulario, setErroresFormulario] = useState<string[]>([]);
  const [verContrasena, setVerContrasena] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [restableciendo, setRestableciendo] = useState<{ usuario: Usuario; contrasena: string } | null>(null);
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
  const [copiado, setCopiado] = useState(false);
  const { confirmar, dialogo } = useConfirmacion();

  const cargar = useCallback(() => {
    api
      .get<Usuario[]>('/usuarios')
      .then(setUsuarios)
      .catch((e: Error) => {
        setError(e.message);
        setUsuarios((actual) => actual ?? []);
      });
  }, []);

  useEffect(cargar, [cargar]);

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(null), 6000);
    return () => clearTimeout(t);
  }, [mensaje]);

  const conteo = useMemo(() => {
    const lista = usuarios ?? [];
    return {
      almaceneros: lista.filter((u) => u.rol === RolUsuario.ALMACENERO && u.activo).length,
      vendedores: lista.filter((u) => u.rol === RolUsuario.VENDEDOR && u.activo).length,
      inactivos: lista.filter((u) => !u.activo).length,
    };
  }, [usuarios]);

  const visibles = useMemo(() => {
    const lista = usuarios ?? [];
    if (filtro === 'todos') return lista.filter((u) => u.activo);
    if (filtro === 'inactivos') return lista.filter((u) => !u.activo);
    return lista.filter((u) => u.rol === filtro && u.activo);
  }, [usuarios, filtro]);

  // ---------------------------------------------------------------- validación
  function validar(f: FormularioUsuario): string[] {
    const errores: string[] = [];
    const nombre = f.nombreCompleto.trim();
    if (nombre.length < 3 || nombre.length > 80) {
      errores.push('El nombre completo debe tener entre 3 y 80 caracteres');
    } else if (!PATRON_NOMBRE.test(nombre)) {
      errores.push('El nombre solo puede contener letras y espacios');
    } else if (nombre.split(' ').filter(Boolean).length < 2) {
      errores.push('Escriba nombre y apellido');
    }
    if (!f.id) {
      if (!esCorreoValido(f.correo)) errores.push('El correo electrónico no es válido (ej. nombre@botica.pe)');
      else if (usuarios?.some((u) => u.correo.toLowerCase() === f.correo.trim().toLowerCase())) {
        errores.push('Ya existe un usuario con ese correo');
      }
      if (!PATRON_CONTRASENA.test(f.contrasena)) {
        errores.push('La contraseña debe tener al menos 8 caracteres, con letras y números');
      }
    }
    return errores;
  }

  // ---------------------------------------------------------------- acciones
  function abrirNuevo() {
    setErroresFormulario([]);
    setVerContrasena(true);
    setFormulario({
      nombreCompleto: '',
      correo: '',
      rol: RolUsuario.VENDEDOR,
      contrasena: generarContrasena(),
    });
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    const errores = validar(formulario);
    setErroresFormulario(errores);
    if (errores.length > 0) return;

    setGuardando(true);
    try {
      if (formulario.id) {
        await api.patch(`/usuarios/${formulario.id}`, {
          nombreCompleto: formulario.nombreCompleto.trim(),
          rol: formulario.rol,
        });
        setMensaje(`Datos de ${formulario.nombreCompleto.trim()} actualizados.`);
      } else {
        const creado = await api.post<Usuario>('/usuarios', {
          nombreCompleto: formulario.nombreCompleto.trim(),
          correo: formulario.correo.trim().toLowerCase(),
          rol: formulario.rol,
          contrasena: formulario.contrasena,
        });
        setCredenciales({
          titulo: `${NOMBRE_ROL[creado.rol]} creado`,
          nombre: creado.nombre_completo,
          correo: creado.correo,
          contrasena: formulario.contrasena,
        });
      }
      setFormulario(null);
      cargar();
    } catch (e) {
      setErroresFormulario([(e as Error).message]);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(usuario: Usuario) {
    const desactivar = usuario.activo;
    let respuesta = '';
    const confirmado = await confirmar({
      titulo: desactivar
        ? `¿Quitar el acceso a ${usuario.nombre_completo}?`
        : `¿Devolver el acceso a ${usuario.nombre_completo}?`,
      mensaje: desactivar
        ? 'No podrá iniciar sesión desde ahora. Sus ventas y movimientos se conservan en el historial.'
        : 'Podrá iniciar sesión otra vez con su correo y contraseña.',
      accion: desactivar ? 'Quitar acceso' : 'Devolver acceso',
      tono: desactivar ? 'neutro' : 'exito',
      Icono: desactivar ? UserMinus : RotateCcw,
      alConfirmar: async () => {
        respuesta = (
          await api.patch<{ mensaje: string }>(
            `/usuarios/${usuario.id}/${desactivar ? 'desactivar' : 'reactivar'}`,
          )
        ).mensaje;
      },
    });
    if (!confirmado) return;
    setMensaje(respuesta);
    cargar();
  }

  async function restablecer(evento: FormEvent) {
    evento.preventDefault();
    if (!restableciendo) return;
    if (!PATRON_CONTRASENA.test(restableciendo.contrasena)) {
      setError('La contraseña debe tener al menos 8 caracteres, con letras y números');
      return;
    }
    setGuardando(true);
    try {
      await api.patch(`/usuarios/${restableciendo.usuario.id}/contrasena`, {
        contrasena: restableciendo.contrasena,
      });
      setCredenciales({
        titulo: 'Contraseña restablecida',
        nombre: restableciendo.usuario.nombre_completo,
        correo: restableciendo.usuario.correo,
        contrasena: restableciendo.contrasena,
      });
      setRestableciendo(null);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function copiarCredenciales() {
    if (!credenciales) return;
    const texto =
      `Acceso a Botica SaaS\nUsuario: ${credenciales.correo}\n` +
      `Contraseña temporal: ${credenciales.contrasena}\n${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError('No se pudo copiar automáticamente; anote los datos manualmente.');
    }
  }

  if (!usuarios) return <EsqueletoUsuarios />;

  const f = formulario;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">
            Personal de la botica: {conteo.almaceneros} almacenero
            {conteo.almaceneros === 1 ? '' : 's'} y {conteo.vendedores} vendedor
            {conteo.vendedores === 1 ? '' : 'es'} con acceso
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      <ControlSegmentado
        etiquetaAccesible="Filtrar usuarios"
        className="w-full max-w-xl"
        valor={filtro}
        alCambiar={setFiltro}
        opciones={[
          { valor: 'todos', etiqueta: 'Todos' },
          { valor: RolUsuario.ALMACENERO, etiqueta: 'Almaceneros' },
          { valor: RolUsuario.VENDEDOR, etiqueta: 'Vendedores' },
          { valor: 'inactivos', etiqueta: `Sin acceso (${conteo.inactivos})` },
        ]}
      />

      {mensaje && (
        <p role="status" className="aparecer flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-4 w-4 shrink-0" /> {mensaje}
        </p>
      )}
      {error && !restableciendo && (
        <p role="alert" className="aparecer flex items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} aria-label="Cerrar aviso" className="rounded p-1 hover:bg-red-100">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}

      {/* ══════ Lista de usuarios ══════ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {visibles.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-500">
            {filtro === 'inactivos'
              ? 'Todos los usuarios tienen acceso.'
              : 'Aún no hay usuarios en este grupo. Cree uno con "Nuevo usuario".'}
          </p>
        ) : (
          <ul key={filtro} className="lista-animada divide-y divide-gray-50">
            {visibles.map((usuario) => {
              const esYo = usuario.id === perfil?.id;
              const gestionable = !esYo && usuario.rol !== RolUsuario.ADMIN;
              return (
                <li key={usuario.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      usuario.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {iniciales(usuario.nombre_completo)}
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <p className="font-semibold text-gray-900">
                      {usuario.nombre_completo}
                      {esYo && <span className="ml-2 text-xs font-medium text-gray-500">(usted)</span>}
                    </p>
                    <p className="text-sm text-gray-500">{usuario.correo}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      usuario.rol === RolUsuario.ADMIN
                        ? 'bg-gray-900 text-white'
                        : usuario.rol === RolUsuario.ALMACENERO
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {NOMBRE_ROL[usuario.rol]}
                  </span>
                  {!usuario.activo && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      Sin acceso
                    </span>
                  )}
                  {gestionable && (
                    <div className="flex shrink-0 items-center gap-1">
                      {usuario.activo && (
                        <>
                          <button
                            title="Editar nombre o rol"
                            aria-label={`Editar a ${usuario.nombre_completo}`}
                            onClick={() => {
                              setErroresFormulario([]);
                              setFormulario({
                                id: usuario.id,
                                nombreCompleto: usuario.nombre_completo,
                                correo: usuario.correo,
                                rol: usuario.rol as RolAsignable,
                                contrasena: '',
                              });
                            }}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Restablecer contraseña"
                            aria-label={`Restablecer la contraseña de ${usuario.nombre_completo}`}
                            onClick={() => {
                              setError(null);
                              setRestableciendo({ usuario, contrasena: generarContrasena() });
                            }}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => cambiarEstado(usuario)}
                        className={`ml-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          usuario.activo
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'boton-primario'
                        }`}
                      >
                        {usuario.activo ? 'Quitar acceso' : 'Devolver acceso'}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ══════ Modal: crear / editar ══════ */}
      {f && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-usuario"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="titulo-usuario" className="text-lg font-bold text-gray-900">
                {f.id ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <button onClick={() => setFormulario(null)} aria-label="Cerrar" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardar} noValidate className="space-y-4">
              {erroresFormulario.length > 0 && (
                <div role="alert" className="aparecer rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p className="flex items-center gap-2 font-semibold">
                    <TriangleAlert className="h-4 w-4" /> Revise los datos
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-6 text-xs">
                    {erroresFormulario.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-gray-500">Rol *</legend>
                <div className="grid grid-cols-2 gap-3">
                  {([RolUsuario.VENDEDOR, RolUsuario.ALMACENERO] as RolAsignable[]).map((rol) => {
                    const { texto, Icono } = DESCRIPCION_ROL[rol];
                    const elegido = f.rol === rol;
                    return (
                      <button
                        key={rol}
                        type="button"
                        aria-pressed={elegido}
                        onClick={() => setFormulario({ ...f, rol })}
                        className={`rounded-xl border-2 p-3 text-left transition ${
                          elegido
                            ? 'border-emerald-600 bg-emerald-50/60'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex items-center gap-2 font-semibold text-gray-900">
                          <Icono className={`h-4 w-4 ${elegido ? 'text-emerald-600' : 'text-gray-400'}`} />
                          {NOMBRE_ROL[rol]}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">{texto}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="usuario-nombre" className="mb-1 block text-xs font-medium text-gray-600">
                  Nombre completo *
                </label>
                <input
                  id="usuario-nombre"
                  autoComplete="off"
                  maxLength={80}
                  value={f.nombreCompleto}
                  onChange={(e) => setFormulario({ ...f, nombreCompleto: e.target.value })}
                  placeholder="Rosa Mamani Quispe"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label htmlFor="usuario-correo" className="mb-1 block text-xs font-medium text-gray-600">
                  Correo electrónico {f.id ? '' : '*'}
                </label>
                <input
                  id="usuario-correo"
                  type="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={!!f.id}
                  value={f.correo}
                  onChange={(e) => setFormulario({ ...f, correo: e.target.value })}
                  placeholder="rosa.mamani@botica.pe"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none disabled:opacity-60"
                />
                {f.id && (
                  <p className="mt-1 text-[11px] text-gray-500">El correo es el usuario de acceso y no se puede cambiar.</p>
                )}
              </div>

              {!f.id && (
                <div>
                  <label htmlFor="usuario-contrasena" className="mb-1 block text-xs font-medium text-gray-600">
                    Contraseña temporal *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="usuario-contrasena"
                        type={verContrasena ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={f.contrasena}
                        onChange={(e) => setFormulario({ ...f, contrasena: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-11 font-mono text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setVerContrasena((v) => !v)}
                        aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-gray-400 hover:text-gray-700"
                      >
                        {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormulario({ ...f, contrasena: generarContrasena() })}
                      title="Generar otra"
                      className="boton-gris flex items-center gap-1.5 rounded-full px-3 text-sm font-medium"
                    >
                      <RefreshCw className="h-4 w-4" /> Generar
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Mínimo 8 caracteres con letras y números. Entréguesela al usuario; podrá cambiarla con
                    “¿Olvidaste tu contraseña?”.
                  </p>
                </div>
              )}

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
                  {guardando ? 'Guardando…' : f.id ? 'Guardar cambios' : `Crear ${NOMBRE_ROL[f.rol].toLowerCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ Modal: restablecer contraseña ══════ */}
      {restableciendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={restablecer}
            noValidate
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-restablecer"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="titulo-restablecer" className="text-lg font-bold text-gray-900">
              Restablecer contraseña
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {restableciendo.usuario.nombre_completo} deberá entrar con esta contraseña nueva.
            </p>
            {error && (
              <p role="alert" className="aparecer mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <div className="mt-4 flex gap-2">
              <input
                aria-label="Contraseña nueva"
                autoComplete="new-password"
                value={restableciendo.contrasena}
                onChange={(e) => setRestableciendo({ ...restableciendo, contrasena: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setRestableciendo({ ...restableciendo, contrasena: generarContrasena() })}
                className="boton-gris flex items-center gap-1.5 rounded-full px-3 text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" /> Generar
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRestableciendo(null);
                  setError(null);
                }}
                className="boton-gris h-11 rounded-full text-[15px] font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="boton-primario h-11 rounded-full text-[15px] font-semibold"
              >
                {guardando ? 'Guardando…' : 'Restablecer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════ Modal: credenciales para entregar ══════ */}
      {credenciales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-credenciales" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-6 w-6" />
            </span>
            <h2 id="titulo-credenciales" className="mt-4 text-lg font-bold text-gray-900">
              {credenciales.titulo}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Entregue estos datos a {credenciales.nombre}. La contraseña no se volverá a mostrar.
            </p>
            <dl className="mt-5 space-y-2 rounded-xl bg-gray-50 p-4 text-left text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Usuario</dt>
                <dd className="truncate font-medium text-gray-900">{credenciales.correo}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Contraseña</dt>
                <dd className="font-mono font-semibold text-gray-900">{credenciales.contrasena}</dd>
              </div>
            </dl>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={copiarCredenciales}
                className="boton-gris flex h-11 items-center justify-center gap-2 rounded-full text-[15px] font-medium"
              >
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCredenciales(null);
                  setCopiado(false);
                }}
                className="boton-primario h-11 rounded-full text-[15px] font-semibold"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {dialogo}
    </div>
  );
}
