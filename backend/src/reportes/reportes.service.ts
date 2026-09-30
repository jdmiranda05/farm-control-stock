import { Injectable } from '@nestjs/common';
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
    const desdeInstante = `${desdeFecha}T00:00:00`;
    const hastaInstante = `${hastaFecha}T23:59:59`;

    // ---- KPIs: se leen todos los movimientos del periodo ----------------
    const { data: movimientos, error } = await this.supabase.cliente
      .from('movimientos_kardex')
      .select('tipo, cantidad, unidad, cantidad_blisters, valor_soles')
      .eq('botica_id', boticaId)
      .gte('creado_en', desdeInstante)
      .lte('creado_en', hastaInstante);
    this.supabase.verificarError(error, 'calcular los indicadores del reporte');

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
        '*, producto:productos(nombre, codigo, activo), lote:lotes(numero_lote, fecha_vencimiento), ' +
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
