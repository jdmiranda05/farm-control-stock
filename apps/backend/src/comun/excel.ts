import { StreamableFile } from '@nestjs/common';
import { Workbook, type Worksheet } from 'exceljs';

/**
 * Generador de libros de Excel (.xlsx) con un formato común para todos los
 * reportes del sistema: encabezado con el nombre de la botica, título,
 * periodo y fecha de generación; cabecera de tabla en el verde de la marca;
 * filtros automáticos; primera fila fija y totales al pie.
 */

export type FormatoColumna = 'texto' | 'entero' | 'soles' | 'fechaHora' | 'fecha';

export interface ColumnaExcel<T> {
  titulo: string;
  ancho: number;
  formato?: FormatoColumna;
  valor: (fila: T) => string | number | Date | null | undefined;
  /** Si es true, la fila de totales suma esta columna. */
  sumar?: boolean;
}

export interface HojaExcel<T = unknown> {
  nombre: string;
  columnas: ColumnaExcel<T>[];
  filas: T[];
}

export interface EncabezadoExcel {
  botica: string;
  titulo: string;
  /** Ej. "Del 01/11/2026 al 15/11/2026". */
  periodo: string;
  /** Pares etiqueta/valor que se muestran en una hoja "Resumen". */
  resumen?: { etiqueta: string; valor: string | number; formato?: FormatoColumna }[];
}

const VERDE = 'FF098451';
const VERDE_SUAVE = 'FFEDF7F1';
const GRIS_TEXTO = 'FF6E6E73';

const FORMATO: Record<FormatoColumna, string | undefined> = {
  texto: undefined,
  entero: '#,##0',
  soles: '"S/" #,##0.00',
  fechaHora: 'dd/mm/yyyy hh:mm',
  fecha: 'dd/mm/yyyy',
};

function escribirEncabezado(hoja: Worksheet, enc: EncabezadoExcel, columnas: number) {
  const generado = new Date().toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  hoja.addRow([enc.botica]).font = { bold: true, size: 14, color: { argb: VERDE } };
  hoja.addRow([enc.titulo]).font = { bold: true, size: 12 };
  hoja.addRow([`${enc.periodo} · Generado el ${generado}`]).font = { size: 10, color: { argb: GRIS_TEXTO } };
  hoja.addRow([]);
  for (let fila = 1; fila <= 3; fila++) hoja.mergeCells(fila, 1, fila, Math.max(columnas, 1));
}

function agregarHojaResumen(libro: Workbook, enc: EncabezadoExcel) {
  if (!enc.resumen?.length) return;
  const hoja = libro.addWorksheet('Resumen', { views: [{ showGridLines: false }] });
  hoja.columns = [{ width: 38 }, { width: 22 }];
  escribirEncabezado(hoja, enc, 2);
  for (const dato of enc.resumen) {
    // Los importes se guardan redondeados a céntimos (evita 6863.2799999…)
    const valor =
      dato.formato === 'soles' && typeof dato.valor === 'number'
        ? Math.round(dato.valor * 100) / 100
        : dato.valor;
    const fila = hoja.addRow([dato.etiqueta, valor]);
    fila.getCell(1).font = { color: { argb: GRIS_TEXTO } };
    fila.getCell(2).font = { bold: true };
    fila.getCell(2).alignment = { horizontal: 'right' };
    const formato = dato.formato ? FORMATO[dato.formato] : undefined;
    if (formato) fila.getCell(2).numFmt = formato;
  }
}

function agregarHojaTabla<T>(libro: Workbook, enc: EncabezadoExcel, hojaDatos: HojaExcel<T>) {
  const { columnas, filas } = hojaDatos;
  const hoja = libro.addWorksheet(hojaDatos.nombre, {
    views: [{ state: 'frozen', ySplit: 5, showGridLines: false }],
  });
  hoja.columns = columnas.map((c) => ({ width: c.ancho }));
  escribirEncabezado(hoja, enc, columnas.length);

  // Cabecera de la tabla (fila 5)
  const cabecera = hoja.addRow(columnas.map((c) => c.titulo));
  cabecera.height = 22;
  cabecera.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
    celda.alignment = { vertical: 'middle', wrapText: true };
  });

  // Filas de datos (con bandas alternas para leer mejor)
  filas.forEach((dato, i) => {
    const fila = hoja.addRow(columnas.map((c) => c.valor(dato) ?? null));
    columnas.forEach((c, j) => {
      const celda = fila.getCell(j + 1);
      const formato = c.formato ? FORMATO[c.formato] : undefined;
      if (formato) celda.numFmt = formato;
      if (c.formato && c.formato !== 'texto') celda.alignment = { horizontal: 'right' };
    });
    if (i % 2 === 1) {
      fila.eachCell({ includeEmpty: true }, (celda) => {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_SUAVE } };
      });
    }
  });

  if (filas.length > 0) {
    hoja.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: columnas.length } };
  }

  // Totales al pie
  if (columnas.some((c) => c.sumar) && filas.length > 0) {
    const primera = 6;
    const ultima = 5 + filas.length;
    const totales = hoja.addRow(
      columnas.map((c, j) => {
        if (j === 0) return 'TOTAL';
        if (!c.sumar) return null;
        const letra = hoja.getColumn(j + 1).letter;
        return { formula: `SUBTOTAL(9,${letra}${primera}:${letra}${ultima})` };
      }),
    );
    totales.font = { bold: true };
    totales.eachCell({ includeEmpty: true }, (celda, j) => {
      celda.border = { top: { style: 'thin', color: { argb: VERDE } } };
      const formato = columnas[j - 1]?.formato ? FORMATO[columnas[j - 1].formato!] : undefined;
      if (formato) celda.numFmt = formato;
    });
  }

  if (filas.length === 0) {
    hoja.addRow(['No hay registros en el periodo seleccionado.']).font = {
      italic: true,
      color: { argb: GRIS_TEXTO },
    };
  }
}

/** Arma el libro completo y lo devuelve listo para descargar. */
export async function generarExcel(
  encabezado: EncabezadoExcel,
  hojas: HojaExcel<any>[],
  nombreArchivo: string,
): Promise<StreamableFile> {
  const libro = new Workbook();
  libro.creator = 'Sistema de Boticas';
  libro.created = new Date();
  agregarHojaResumen(libro, encabezado);
  for (const hoja of hojas) agregarHojaTabla(libro, encabezado, hoja);

  const buffer = Buffer.from(await libro.xlsx.writeBuffer());
  return new StreamableFile(buffer, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    disposition: `attachment; filename="${nombreArchivo}"`,
    length: buffer.length,
  });
}

/** "2026-11-01" -> "01/11/2026" */
export function fechaLegible(fecha: string): string {
  const [a, m, d] = fecha.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}
