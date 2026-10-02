import { Injectable } from '@nestjs/common';
import {
  EstadoAlerta,
  EstadoSemaforo,
  ProductoConStock,
  ResumenPanel,
  TipoMovimientoKardex,
  diasParaVencer,
  hoyIso,
} from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Servicio del Dashboard: consolida en UNA sola respuesta los indicadores
 * principales y la tabla de productos que requieren atención.
 */
@Injectable()
export class PanelService {
  constructor(private readonly supabase: SupabaseService) {}

  async obtenerResumen(boticaId: string): Promise<ResumenPanel> {
    // Días de anticipación configurados por la botica
    const { data: botica } = await this.supabase.cliente
      .from('boticas')
      .select('dias_alerta_vencimiento')
      .eq('id', boticaId)
      .single();
    const diasAlerta: number = botica?.dias_alerta_vencimiento ?? 30;

    // 1) Stock consolidado por producto (la vista hace el trabajo pesado)
    const { data: productosCrudos, error } = await this.supabase.cliente
      .from('vista_stock_productos')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('activo', true);
    this.supabase.verificarError(error, 'consultar el resumen de stock');
    const productos = (productosCrudos ?? []) as ProductoConStock[];

    // 2) Lotes con existencias: para contar los que vencen pronto o ya vencieron
    const { data: lotes } = await this.supabase.cliente
      .from('lotes')
      .select('fecha_vencimiento, cajas_completas, blisters_sueltos')
      .eq('botica_id', boticaId);

    let lotesPorVencer = 0;
    let lotesVencidos = 0;
    for (const lote of lotes ?? []) {
      // Un lote agotado ya no representa riesgo aunque esté vencido.
      const tieneExistencias = lote.cajas_completas > 0 || lote.blisters_sueltos > 0;
      if (!tieneExistencias) continue;

      const dias = diasParaVencer(lote.fecha_vencimiento);
      if (dias < 0) lotesVencidos++;
      else if (dias <= diasAlerta) lotesPorVencer++;
    }

    // 3) Alertas activas
    const { count: alertasActivas } = await this.supabase.cliente
      .from('alertas')
      .select('id', { count: 'exact', head: true })
      .eq('botica_id', boticaId)
      .eq('estado', EstadoAlerta.ACTIVA);

    // 4) Ventas de hoy (en soles)
    const { data: ventasHoy } = await this.supabase.cliente
      .from('ventas')
      .select('total_soles')
      .eq('botica_id', boticaId)
      .gte('creado_en', `${hoyIso()}T00:00:00`);
    const ventasHoySoles = (ventasHoy ?? []).reduce(
      (suma, venta) => suma + Number(venta.total_soles),
      0,
    );

    // 5) Merma acumulada registrada (histórica, en soles)
    const { data: mermas } = await this.supabase.cliente
      .from('movimientos_kardex')
      .select('valor_soles')
      .eq('botica_id', boticaId)
      .eq('tipo', TipoMovimientoKardex.SALIDA_MERMA);
    const mermaAcumuladaSoles = (mermas ?? []).reduce(
      (suma, movimiento) => suma + Number(movimiento.valor_soles),
      0,
    );

    // 6) Productos que requieren atención: los críticos primero y, dentro
    //    de cada grupo, los que vencen antes.
    const severidad: Record<EstadoSemaforo, number> = {
      [EstadoSemaforo.ROJO]: 0,
      [EstadoSemaforo.AMARILLO]: 1,
      [EstadoSemaforo.VERDE]: 2,
    };
    /** El peor de los dos semáforos del producto (stock y vencimiento). */
    const peorEstado = (producto: ProductoConStock) =>
      Math.min(severidad[producto.estado_stock], severidad[producto.estado_vencimiento]);

    const productosAtencion = productos
      .filter((producto) => peorEstado(producto) < severidad[EstadoSemaforo.VERDE])
      .sort(
        (a, b) =>
          peorEstado(a) - peorEstado(b) ||
          (a.dias_para_vencer ?? 9999) - (b.dias_para_vencer ?? 9999),
      )
      .slice(0, 10);

    return {
      kpis: {
        totalProductos: productos.length,
        blistersEnStock: productos.reduce((suma, p) => suma + p.stock_blisters, 0),
        productosStockBajo: productos.filter(
          (p) => p.estado_stock === EstadoSemaforo.AMARILLO,
        ).length,
        productosStockCritico: productos.filter(
          (p) => p.estado_stock === EstadoSemaforo.ROJO,
        ).length,
        lotesPorVencer,
        lotesVencidos,
        alertasActivas: alertasActivas ?? 0,
        ventasHoySoles: Number(ventasHoySoles.toFixed(2)),
        mermaAcumuladaSoles: Number(mermaAcumuladaSoles.toFixed(2)),
      },
      productosAtencion,
    };
  }
}
