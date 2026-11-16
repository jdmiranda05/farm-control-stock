import { BadRequestException } from '@nestjs/common';

/**
 * Lee TODAS las filas de una consulta, en bloques.
 *
 * Supabase (PostgREST) devuelve como máximo 1 000 filas por consulta. Para
 * calcular totales o exportar un periodo largo hay que pedirlas por partes:
 * `crearConsulta(desde, hasta)` debe devolver la consulta con `.range(desde, hasta)`
 * y un orden estable.
 */
export async function obtenerTodos<T>(
  crearConsulta: (desde: number, hasta: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  opciones: { tamanoBloque?: number; maximo?: number; contexto?: string } = {},
): Promise<T[]> {
  const tamano = opciones.tamanoBloque ?? 1000;
  const maximo = opciones.maximo ?? 50_000;
  const filas: T[] = [];

  for (let desde = 0; ; desde += tamano) {
    const { data, error } = await crearConsulta(desde, desde + tamano - 1);
    if (error) throw new Error(`Error al ${opciones.contexto ?? 'leer los datos'}: ${error.message}`);
    filas.push(...((data ?? []) as T[]));
    if (!data || data.length < tamano) break;
    if (filas.length >= maximo) {
      throw new BadRequestException(
        `El periodo tiene más de ${maximo.toLocaleString('es-PE')} registros. ` +
          'Elija un rango de fechas más corto.',
      );
    }
  }
  return filas;
}
