import type { CSSProperties, ReactNode } from 'react';

export interface OpcionSegmento<T extends string> {
  valor: T;
  etiqueta: ReactNode;
}

interface Props<T extends string> {
  opciones: OpcionSegmento<T>[];
  valor: T;
  alCambiar: (valor: T) => void;
  etiquetaAccesible: string;
  className?: string;
}

/**
 * Control segmentado (equivalente web de UISegmentedControl).
 * El indicador blanco se desliza hasta la opción elegida (ver .segmentado
 * en global.css); úselo para alternar vistas o modos excluyentes.
 */
export function ControlSegmentado<T extends string>({
  opciones,
  valor,
  alCambiar,
  etiquetaAccesible,
  className = '',
}: Props<T>) {
  const indice = Math.max(
    opciones.findIndex((o) => o.valor === valor),
    0,
  );
  const estilo = { '--indice': indice, '--total': opciones.length } as CSSProperties;

  return (
    <div role="group" aria-label={etiquetaAccesible} className={`segmentado ${className}`} style={estilo}>
      {opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          aria-pressed={opcion.valor === valor}
          onClick={() => alCambiar(opcion.valor)}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}
