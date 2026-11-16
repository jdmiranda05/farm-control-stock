import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

/**
 * Selector desplegable propio (equivalente web del "pop-up button" de Apple).
 *
 * Reemplaza a <select>: la lista que abre un <select> nativo la dibuja el
 * sistema operativo y no se puede estilizar, por eso no combinaba con el
 * resto de la interfaz. Este componente:
 *   - Muestra la opción elegida en el botón y la marca con ✓ en la lista
 *     (HIG › Pop-up buttons: lista plana de opciones excluyentes).
 *   - Se abre con una animación breve desde el propio botón y se cierra
 *     al elegir, con Esc o tocando fuera.
 *   - Se maneja por teclado: ↑ ↓ Inicio Fin Enter Esc y búsqueda por letra.
 *   - En listas largas agrega un campo para filtrar.
 *   - Se dibuja en un portal, así no lo recortan tablas ni modales.
 */

export interface OpcionSelector {
  valor: string;
  etiqueta: string;
  /** Texto secundario bajo la etiqueta (ej. "10 blísters/caja"). */
  detalle?: string;
  deshabilitada?: boolean;
}

interface Props {
  valor: string;
  alCambiar: (valor: string) => void;
  opciones: OpcionSelector[];
  /** Texto cuando no hay nada elegido. */
  marcador?: string;
  id?: string;
  etiquetaAccesible?: string;
  invalido?: boolean;
  deshabilitado?: boolean;
  /** Muestra un campo de búsqueda (por defecto, con más de 8 opciones). */
  buscable?: boolean;
  /** Texto de ayuda del buscador (ej. "Buscar por nombre o RUC…"). */
  marcadorBusqueda?: string;
  className?: string;
  icono?: ReactNode;
}

const ALTO_MAXIMO = 300;
const MARGEN = 6;

export function Selector({
  valor,
  alCambiar,
  opciones,
  marcador = 'Seleccione…',
  id,
  etiquetaAccesible,
  invalido,
  deshabilitado,
  buscable,
  marcadorBusqueda = 'Buscar…',
  className = '',
  icono,
}: Props) {
  const idBase = useId();
  const idLista = `${idBase}-lista`;
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const campoBusqueda = useRef<HTMLInputElement>(null);

  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [filtro, setFiltro] = useState('');
  const [posicion, setPosicion] = useState<{
    top: number;
    left: number;
    width: number;
    haciaArriba: boolean;
    alto: number;
  } | null>(null);
  const tecleado = useRef({ texto: '', hasta: 0 });

  const conBusqueda = buscable ?? opciones.length > 8;
  const seleccionada = opciones.find((o) => o.valor === valor);

  const visibles = useMemo(() => {
    // Sin tildes ni mayúsculas: "drogueria" encuentra "Droguería"; "2045" encuentra el RUC
    const normalizar = (t: string) =>
      t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const texto = normalizar(filtro.trim());
    if (!texto) return opciones;
    return opciones.filter(
      (o) =>
        normalizar(o.etiqueta).includes(texto) || (o.detalle ? normalizar(o.detalle).includes(texto) : false),
    );
  }, [opciones, filtro]);

  /** Coloca la lista bajo el botón, o encima si no cabe abajo. */
  const ubicar = useCallback(() => {
    const r = boton.current?.getBoundingClientRect();
    if (!r) return;
    const espacioAbajo = window.innerHeight - r.bottom - MARGEN * 2;
    const espacioArriba = r.top - MARGEN * 2;
    const haciaArriba = espacioAbajo < 220 && espacioArriba > espacioAbajo;
    const alto = Math.min(ALTO_MAXIMO, haciaArriba ? espacioArriba : espacioAbajo);
    setPosicion({
      top: haciaArriba ? r.top - MARGEN : r.bottom + MARGEN,
      left: r.left,
      width: Math.max(r.width, 200),
      haciaArriba,
      alto: Math.max(alto, 140),
    });
  }, []);

  function abrir() {
    if (deshabilitado) return;
    ubicar();
    setFiltro('');
    setActivo(Math.max(opciones.findIndex((o) => o.valor === valor), 0));
    setCerrando(false);
    setAbierto(true);
  }

  const cerrar = useCallback((devolverFoco = true) => {
    setCerrando(true);
    setTimeout(() => {
      setAbierto(false);
      setCerrando(false);
    }, 120);
    if (devolverFoco) boton.current?.focus();
  }, []);

  function elegir(opcion: OpcionSelector | undefined) {
    if (!opcion || opcion.deshabilitada) return;
    alCambiar(opcion.valor);
    cerrar();
  }

  // Mientras está abierta: seguir al botón al desplazar y cerrar al tocar fuera
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      const objetivo = e.target as Node;
      if (!boton.current?.contains(objetivo) && !lista.current?.parentElement?.contains(objetivo)) {
        cerrar(false);
      }
    };
    window.addEventListener('mousedown', alTocar);
    window.addEventListener('resize', ubicar);
    window.addEventListener('scroll', ubicar, true);
    return () => {
      window.removeEventListener('mousedown', alTocar);
      window.removeEventListener('resize', ubicar);
      window.removeEventListener('scroll', ubicar, true);
    };
  }, [abierto, cerrar, ubicar]);

  // Foco inicial: el buscador, o la propia lista
  useLayoutEffect(() => {
    if (!abierto || cerrando) return;
    if (conBusqueda) campoBusqueda.current?.focus();
    else lista.current?.focus();
  }, [abierto, cerrando, conBusqueda]);

  // Mantener visible la opción activa
  useEffect(() => {
    if (!abierto) return;
    lista.current
      ?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activo, abierto]);

  function mover(delta: number) {
    if (visibles.length === 0) return;
    let i = activo;
    for (let paso = 0; paso < visibles.length; paso++) {
      i = (i + delta + visibles.length) % visibles.length;
      if (!visibles[i].deshabilitada) break;
    }
    setActivo(i);
  }

  function alTeclearEnLista(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        mover(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        mover(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActivo(0);
        break;
      case 'End':
        e.preventDefault();
        setActivo(visibles.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        elegir(visibles[activo]);
        break;
      case ' ':
        if (!conBusqueda) {
          e.preventDefault();
          elegir(visibles[activo]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation(); // no cerrar también el modal que lo contiene
        cerrar();
        break;
      case 'Tab':
        cerrar(false);
        break;
      default:
        // Búsqueda por letra (sin campo de búsqueda): salta a la opción
        if (!conBusqueda && e.key.length === 1) {
          const ahora = Date.now();
          const t = tecleado.current;
          t.texto = ahora < t.hasta ? t.texto + e.key.toLowerCase() : e.key.toLowerCase();
          t.hasta = ahora + 700;
          const i = visibles.findIndex((o) => o.etiqueta.toLowerCase().startsWith(t.texto));
          if (i >= 0) setActivo(i);
        }
    }
  }

  function alTeclearEnBoton(e: KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      abrir();
    }
  }

  const lista_ = abierto && posicion
    ? createPortal(
        <div
          className={`selector-capa ${cerrando ? 'cerrando' : ''} ${posicion.haciaArriba ? 'hacia-arriba' : ''}`}
          style={{
            position: 'fixed',
            left: posicion.left,
            width: posicion.width,
            ...(posicion.haciaArriba
              ? { bottom: window.innerHeight - posicion.top }
              : { top: posicion.top }),
            zIndex: 80,
          }}
        >
          {conBusqueda && (
            <div className="selector-buscador">
              <Search className="h-4 w-4 shrink-0 text-[#8e8e93]" aria-hidden="true" />
              <input
                ref={campoBusqueda}
                value={filtro}
                onChange={(e) => {
                  setFiltro(e.target.value);
                  setActivo(0);
                }}
                onKeyDown={alTeclearEnLista}
                placeholder={marcadorBusqueda}
                aria-label="Buscar opción"
                aria-controls={idLista}
                aria-activedescendant={activo >= 0 ? `${idBase}-op-${activo}` : undefined}
              />
            </div>
          )}
          <ul
            ref={lista}
            id={idLista}
            role="listbox"
            tabIndex={-1}
            aria-label={etiquetaAccesible}
            aria-activedescendant={activo >= 0 ? `${idBase}-op-${activo}` : undefined}
            onKeyDown={alTeclearEnLista}
            className="selector-lista"
            style={{ maxHeight: posicion.alto - (conBusqueda ? 48 : 0) }}
          >
            {visibles.length === 0 && <li className="selector-vacio">Sin resultados</li>}
            {visibles.map((opcion, i) => {
              const elegida = opcion.valor === valor;
              return (
                <li
                  key={opcion.valor || '__vacio'}
                  id={`${idBase}-op-${i}`}
                  data-indice={i}
                  role="option"
                  aria-selected={elegida}
                  aria-disabled={opcion.deshabilitada || undefined}
                  className={`selector-opcion ${i === activo ? 'activa' : ''} ${
                    opcion.deshabilitada ? 'deshabilitada' : ''
                  }`}
                  onMouseEnter={() => setActivo(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(opcion)}
                >
                  <Check
                    className={`h-4 w-4 shrink-0 ${elegida ? 'opacity-100' : 'opacity-0'}`}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{opcion.etiqueta}</span>
                    {opcion.detalle && <span className="selector-detalle">{opcion.detalle}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={boton}
        id={id}
        type="button"
        disabled={deshabilitado}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? idLista : undefined}
        aria-label={etiquetaAccesible ? `${etiquetaAccesible}: ${seleccionada?.etiqueta ?? marcador}` : undefined}
        aria-invalid={invalido || undefined}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={alTeclearEnBoton}
        className={`selector-boton ${/(^|\s)w-/.test(className) ? '' : 'w-full'} ${
          abierto ? 'abierto' : ''
        } ${invalido ? 'campo-invalido' : ''} ${className}`}
      >
        {icono}
        <span className={`min-w-0 flex-1 truncate text-left ${seleccionada ? '' : 'text-[#8e8e93]'}`}>
          {seleccionada?.etiqueta ?? marcador}
        </span>
        <ChevronsUpDown className="selector-chevron h-4 w-4 shrink-0" aria-hidden="true" />
      </button>
      {lista_}
    </>
  );
}
