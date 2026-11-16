import { BadRequestException, Injectable } from '@nestjs/common';
import {
  KpisReporteDiario,
  MermaProducto,
  MovimientoDetallado,
  ReporteDiario,
  ResumenMerma,
  TipoMovimientoKardex,
  UnidadEmpaque,
  hoyIso,
} from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';
import { armarRespuestaPaginada, calcularRango } from '../comun/dto/paginacion.dto';
import { fechaParaExcel, finDelDia, inicioDelDia } from '../comun/fechas-peru';
import { obtenerTodos } from '../comun/consultas';
import { fechaLegible, generarExcel } from '../comun/excel';
import { COLUMNAS_MOVIMIENTOS } from '../comun/columnas-kardex';
import { FiltroReporteDto } from './dto/filtro-reporte.dto';

/**
 * Servicio de REPORTES gerenciales.
 *
 *  1. Reporte de entradas y salidas por fecha (o rango), con KPIs y
 *     tabla detallada paginada.
 *  2. Reporte de merma económica en soles, por producto y total.
 */
@Injectable()
export class ReportesService {
  constructor(private readonly supabase: SupabaseService) {}

  // ============================================================
  // 1) REPORTE DE ENTRADAS Y SALIDAS
  // ============================================================

  /**
   * Devuelve los indicadores del periodo y la tabla de movimientos.
   *
   * Detalle de implementación: los KPIs se calculan sobre TODOS los
   * movimientos del periodo (consulta liviana, solo las columnas numéricas),
   * mientras que la tabla devuelve únicamente la página solicitada. Así los
   * totales son correctos aunque el usuario esté viendo la página 1 de 20.
   */
  async reporteDiario(boticaId: string, filtros: FiltroReporteDto): Promise<ReporteDiario> {
    // Sin fechas -> el día de hoy. Con solo "desde" -> ese día.
    const desdeFecha = filtros.desde ?? hoyIso();
    const hastaFecha = filtros.hasta ?? desdeFecha;
    // Día completo en hora de PERÚ (no UTC): una venta de las 8 p. m. es de ese día
    const desdeInstante = inicioDelDia(desdeFecha);
    const hastaInstante = finDelDia(hastaFecha);

    // ---- KPIs: se leen TODOS los movimientos del periodo ----------------
    // (en bloques: Supabase devuelve como máximo 1 000 filas por consulta y,
    // sin esto, los totales de un mes quedaban recortados)
    const movimientos = await obtenerTodos<{
      tipo: TipoMovimientoKardex;
      cantidad: number;
      unidad: UnidadEmpaque;
      cantidad_blisters: number;
      valor_soles: number;
    }>(
      (desde, hasta) =>
        this.supabase.cliente
          .from('movimientos_kardex')
          .select('tipo, cantidad, unidad, cantidad_blisters, valor_soles')
          .eq('botica_id', boticaId)
          .gte('creado_en', desdeInstante)
          .lte('creado_en', hastaInstante)
          .order('id', { ascending: true })
          .range(desde, hasta),
      { contexto: 'calcular los indicadores del reporte' },
    );

    const kpis: KpisReporteDiario = {
      cajasIngresadas: 0,
      blistersIngresados: 0,
      valorEntradasSoles: 0,
      blistersRetirados: 0,
      blistersVendidos: 0,
      blistersMerma: 0,
      valorVentasSoles: 0,
      valorMermaSoles: 0,
      cantidadVentas: 0,
    };

    for (const movimiento of movimientos ?? []) {
      const blisters = Number(movimiento.cantidad_blisters) || 0;
      const valor = Number(movimiento.valor_soles) || 0;

      switch (movimiento.tipo) {
        case TipoMovimientoKardex.ENTRADA_MANUAL:
          kpis.blistersIngresados += blisters;
          kpis.valorEntradasSoles += valor;
          // Las entradas se registran en cajas; si alguna vino en blísters,
          // no suma al contador de cajas (pero sí al de blísters).
          if (movimiento.unidad === UnidadEmpaque.CAJA) {
            kpis.cajasIngresadas += Number(movimiento.cantidad) || 0;
          }
          break;

        case TipoMovimientoKardex.SALIDA_VENTA:
          kpis.blistersVendidos += blisters;
          kpis.blistersRetirados += blisters;
          kpis.valorVentasSoles += valor;
          break;

        case TipoMovimientoKardex.SALIDA_MERMA:
          kpis.blistersMerma += blisters;
          kpis.blistersRetirados += blisters;
          kpis.valorMermaSoles += valor;
          break;

        // Los ajustes administrativos no se suman a entradas ni a salidas:
        // son correcciones del historial, no mercadería que se movió.
        case TipoMovimientoKardex.AJUSTE_ADMIN:
        default:
          break;
      }
    }

    // Número de comprobantes emitidos en el periodo
    const { count: cantidadVentas } = await this.supabase.cliente
      .from('ventas')
      .select('id', { count: 'exact', head: true })
      .eq('botica_id', boticaId)
      .gte('creado_en', desdeInstante)
      .lte('creado_en', hastaInstante);
    kpis.cantidadVentas = cantidadVentas ?? 0;

    // Redondeo final de los importes a 2 decimales
    kpis.valorEntradasSoles = Number(kpis.valorEntradasSoles.toFixed(2));
    kpis.valorVentasSoles = Number(kpis.valorVentasSoles.toFixed(2));
    kpis.valorMermaSoles = Number(kpis.valorMermaSoles.toFixed(2));

    // ---- Tabla detallada (solo la página pedida) ------------------------
    // `usuarios!usuario_id` indica por cuál de las dos claves foráneas hacia
    // `usuarios` se hace el join (la otra es `editado_por`).
    const { pagina, porPagina, desde, hasta } = calcularRango(filtros);
    const { data: pagina_datos, count } = await this.supabase.cliente
      .from('movimientos_kardex')
      .select(
        '*, producto:productos(nombre, codigo, activo, unidades_por_caja), lote:lotes(numero_lote, fecha_vencimiento), ' +
          'proveedor:proveedores(nombre), usuario:usuarios!usuario_id(nombre_completo)',
        { count: 'exact' },
      )
      .eq('botica_id', boticaId)
      .gte('creado_en', desdeInstante)
      .lte('creado_en', hastaInstante)
      .order('creado_en', { ascending: false })
      .range(desde, hasta);

    return {
      desde: desdeFecha,
      hasta: hastaFecha,
      kpis,
      movimientos: armarRespuestaPaginada(
        (pagina_datos ?? []) as unknown as MovimientoDetallado[],
        count ?? 0,
        pagina,
        porPagina,
      ),
    };
  }

  /**
   * EXPORTAR a Excel el reporte del periodo: hoja "Resumen" con los
   * indicadores, "Movimientos" con todo el kardex del periodo y "Ventas"
   * con cada comprobante emitido y su vendedor.
   */
  async exportarReporteDiario(boticaId: string, nombreBotica: string, filtros: FiltroReporteDto) {
    const desdeFecha = filtros.desde ?? hoyIso();
    const hastaFecha = filtros.hasta ?? desdeFecha;
    if (desdeFecha > hastaFecha) {
      throw new BadRequestException('La fecha "desde" no puede ser posterior a la fecha "hasta"');
    }
    const desdeInstante = inicioDelDia(desdeFecha);
    const hastaInstante = finDelDia(hastaFecha);

    const [{ kpis }, movimientos, ventas] = await Promise.all([
      this.reporteDiario(boticaId, { desde: desdeFecha, hasta: hastaFecha, pagina: 1, porPagina: 1 }),
      obtenerTodos<MovimientoDetallado>(
        (desde, hasta) =>
          this.supabase.cliente
            .from('movimientos_kardex')
            .select(
              '*, producto:productos(nombre, codigo, activo, unidades_por_caja), lote:lotes(numero_lote, fecha_vencimiento), ' +
                'proveedor:proveedores(nombre), usuario:usuarios!usuario_id(nombre_completo)',
            )
            .eq('botica_id', boticaId)
            .gte('creado_en', desdeInstante)
            .lte('creado_en', hastaInstante)
            .order('creado_en', { ascending: true })
            .order('id', { ascending: true })
            .range(desde, hasta),
        { contexto: 'exportar los movimientos' },
      ),
      obtenerTodos<{
        numero_comprobante: string;
        total_soles: number;
        creado_en: string;
        usuario: { nombre_completo: string } | null;
        detalles: { cantidad: number }[];
      }>(
        (desde, hasta) =>
          this.supabase.cliente
            .from('ventas')
            .select('numero_comprobante, total_soles, creado_en, usuario:usuarios(nombre_completo), detalles:detalles_venta(cantidad)')
            .eq('botica_id', boticaId)
            .gte('creado_en', desdeInstante)
            .lte('creado_en', hastaInstante)
            .order('creado_en', { ascending: true })
            .order('id', { ascending: true })
            .range(desde, hasta),
        { contexto: 'exportar las ventas' },
      ),
    ]);

    const periodo =
      desdeFecha === hastaFecha
        ? `Día ${fechaLegible(desdeFecha)}`
        : `Del ${fechaLegible(desdeFecha)} al ${fechaLegible(hastaFecha)}`;
    const resumen = [
      { etiqueta: 'Cajas ingresadas', valor: kpis.cajasIngresadas, formato: 'entero' as const },
      { etiqueta: 'Blísters / unidades ingresados', valor: kpis.blistersIngresados, formato: 'entero' as const },
      { etiqueta: 'Valor de entradas (costo)', valor: kpis.valorEntradasSoles, formato: 'soles' as const },
      { etiqueta: 'Blísters / unidades vendidos', valor: kpis.blistersVendidos, formato: 'entero' as const },
      { etiqueta: 'Blísters / unidades en merma', valor: kpis.blistersMerma, formato: 'entero' as const },
      { etiqueta: 'Comprobantes emitidos', valor: kpis.cantidadVentas, formato: 'entero' as const },
      { etiqueta: 'Valor de ventas', valor: kpis.valorVentasSoles, formato: 'soles' as const },
      {
        etiqueta: 'Ticket promedio',
        valor: kpis.cantidadVentas > 0 ? Number((kpis.valorVentasSoles / kpis.cantidadVentas).toFixed(2)) : 0,
        formato: 'soles' as const,
      },
      { etiqueta: 'Pérdida por merma (costo)', valor: kpis.valorMermaSoles, formato: 'soles' as const },
    ];

    const nombre =
      desdeFecha === hastaFecha ? `reporte_${desdeFecha}.xlsx` : `reporte_${desdeFecha}_a_${hastaFecha}.xlsx`;
    return generarExcel(
      { botica: nombreBotica, titulo: 'Reporte de entradas y salidas', periodo, resumen },
      [
        { nombre: 'Movimientos', columnas: COLUMNAS_MOVIMIENTOS, filas: movimientos },
        {
          nombre: 'Ventas',
          filas: ventas,
          columnas: [
            { titulo: 'Fecha y hora', ancho: 17, formato: 'fechaHora', valor: (v: (typeof ventas)[number]) => fechaParaExcel(v.creado_en) },
            { titulo: 'Comprobante', ancho: 14, valor: (v: (typeof ventas)[number]) => v.numero_comprobante },
            { titulo: 'Vendedor', ancho: 26, valor: (v: (typeof ventas)[number]) => v.usuario?.nombre_completo ?? '' },
            { titulo: 'Líneas', ancho: 9, formato: 'entero', valor: (v: (typeof ventas)[number]) => v.detalles?.length ?? 0 },
            { titulo: 'Total (S/)', ancho: 13, formato: 'soles', sumar: true, valor: (v: (typeof ventas)[number]) => Number(v.total_soles) },
          ],
        },
      ],
      nombre,
    );
  }

  // ============================================================
  // 2) REPORTE DE MERMA ECONÓMICA
  // ============================================================

  /**
   * Pérdidas por medicamentos vencidos o dañados, en soles.
   * Lee la vista `vista_merma_productos`, que distingue:
   *   - merma REGISTRADA: ya declarada por el almacenero (SALIDA_MERMA)
   *   - merma POTENCIAL:  mercadería vencida que sigue en los lotes
   */
  async reporteMerma(boticaId: string): Promise<ResumenMerma> {
    const { data, error } = await this.supabase.cliente
      .from('vista_merma_productos')
      .select('*')
      .eq('botica_id', boticaId);
    this.supabase.verificarError(error, 'calcular la merma');

    const productos = ((data ?? []) as MermaProducto[])
      // Solo interesan los productos que efectivamente tienen pérdidas.
      .filter(
        (item) =>
          Number(item.merma_registrada_soles) > 0 || Number(item.merma_potencial_soles) > 0,
      )
      .sort(
        (a, b) =>
          Number(b.merma_registrada_soles) + Number(b.merma_potencial_soles) -
          (Number(a.merma_registrada_soles) + Number(a.merma_potencial_soles)),
      );

    const totalRegistradaSoles = productos.reduce(
      (suma, item) => suma + Number(item.merma_registrada_soles),
      0,
    );
    const totalPotencialSoles = productos.reduce(
      (suma, item) => suma + Number(item.merma_potencial_soles),
      0,
    );

    return {
      totalRegistradaSoles: Number(totalRegistradaSoles.toFixed(2)),
      totalPotencialSoles: Number(totalPotencialSoles.toFixed(2)),
      productos,
    };
  }
}
