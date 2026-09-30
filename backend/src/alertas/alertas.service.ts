import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Alerta,
  AlertaDetallada,
  ContadorAlertas,
  EstadoAlerta,
  EstadoSemaforo,
  ProductoConStock,
  ResumenGeneracionAlertas,
  TipoAlerta,
  diasParaVencer,
  formatearFecha,
  formatearStock,
} from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';

/** Alerta que "debería existir" según el estado actual del inventario. */
interface AlertaDeseada {
  tipo: TipoAlerta;
  producto_id: string | null;
  lote_id: string | null;
  mensaje: string;
}

/**
 * ════════════════════════════════════════════════════════════════
 *  MOTOR DE ALERTAS
 * ════════════════════════════════════════════════════════════════
 *
 * Reglas de negocio:
 *   1. STOCK_MINIMO: el stock del producto está en AMARILLO o ROJO según
 *      el semáforo calculado por la vista (stock vs. stock mínimo).
 *   2. VENCIMIENTO_PROXIMO: a un lote con existencias le faltan a lo sumo
 *      `dias_alerta_vencimiento` días para vencer (parámetro de la botica).
 *   3. VENCIDO: el lote ya pasó su fecha y todavía tiene mercadería.
 *
 * Estrategia de RECONCILIACIÓN (idempotente: se puede ejecutar mil veces):
 *   a) Se calcula el conjunto de alertas que DEBERÍAN existir hoy.
 *   b) Se compara con las alertas ACTIVAS guardadas en la tabla.
 *   c) Se crean las que faltan, se refresca el mensaje de las que cambiaron
 *      y se marcan RESUELTAS las que ya no corresponden.
 */
@Injectable()
export class AlertasService {
  private readonly registrador = new Logger(AlertasService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // ============================================================
  // GENERACIÓN / RECONCILIACIÓN
  // ============================================================

  async generarAlertas(boticaId: string): Promise<ResumenGeneracionAlertas> {
    // ---- Datos de entrada ------------------------------------------------
    const { data: botica } = await this.supabase.cliente
      .from('boticas')
      .select('dias_alerta_vencimiento')
      .eq('id', boticaId)
      .single();
    const diasAlerta: number = botica?.dias_alerta_vencimiento ?? 30;

    const { data: productos, error: errorVista } = await this.supabase.cliente
      .from('vista_stock_productos')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('activo', true);
    this.supabase.verificarError(errorVista, 'consultar el stock consolidado');

    const { data: lotes, error: errorLotes } = await this.supabase.cliente
      .from('lotes')
      .select('*, producto:productos(id, nombre, activo, unidades_por_caja)')
      .eq('botica_id', boticaId);
    this.supabase.verificarError(errorLotes, 'consultar los lotes');

    // ---- (a) Conjunto de alertas deseadas --------------------------------
    const deseadas = new Map<string, AlertaDeseada>();
    const clave = (tipo: string, productoId: string | null, loteId: string | null) =>
      `${tipo}|${productoId ?? ''}|${loteId ?? ''}`;

    // Regla 1: stock mínimo (a nivel de PRODUCTO)
    for (const p of (productos ?? []) as ProductoConStock[]) {
      if (p.estado_stock === EstadoSemaforo.VERDE) continue;

      const stockLegible = formatearStock(p.stock_blisters, p.unidades_por_caja);
      const mensaje =
        p.stock_blisters === 0
          ? `Sin stock: "${p.nombre}" no tiene existencias disponibles.`
          : p.estado_stock === EstadoSemaforo.ROJO
            ? `Stock crítico: "${p.nombre}" tiene ${stockLegible}, por debajo de la ` +
              `mitad de su mínimo (${p.stock_minimo} blísters).`
            : `Stock bajo: "${p.nombre}" tiene ${stockLegible} y su mínimo es ` +
              `${p.stock_minimo} blísters.`;

      deseadas.set(clave(TipoAlerta.STOCK_MINIMO, p.id, null), {
        tipo: TipoAlerta.STOCK_MINIMO,
        producto_id: p.id,
        lote_id: null,
        mensaje,
      });
    }

    // Reglas 2 y 3: vencimiento (a nivel de LOTE)
    for (const lote of lotes ?? []) {
      if (!lote.producto?.activo) continue; // no alertar productos dados de baja

      const porCaja = Math.max(lote.producto?.unidades_por_caja ?? 1, 1);
      const existencias = lote.cajas_completas * porCaja + lote.blisters_sueltos;
      if (existencias === 0) continue; // lote agotado: ya no hay riesgo

      const dias = diasParaVencer(lote.fecha_vencimiento);
      const nombreProducto = lote.producto?.nombre ?? 'producto';
      const stockLegible = formatearStock(existencias, porCaja);

      if (dias < 0) {
        deseadas.set(clave(TipoAlerta.VENCIDO, lote.producto_id, lote.id), {
          tipo: TipoAlerta.VENCIDO,
          producto_id: lote.producto_id,
          lote_id: lote.id,
          mensaje:
            `Lote vencido: ${lote.numero_lote} de "${nombreProducto}" venció el ` +
            `${formatearFecha(lote.fecha_vencimiento)} y aún tiene ${stockLegible}. ` +
            `Retírelo y regístrelo como merma.`,
        });
      } else if (dias <= diasAlerta) {
        deseadas.set(clave(TipoAlerta.VENCIMIENTO_PROXIMO, lote.producto_id, lote.id), {
          tipo: TipoAlerta.VENCIMIENTO_PROXIMO,
          producto_id: lote.producto_id,
          lote_id: lote.id,
          mensaje:
            `Vencimiento próximo: el lote ${lote.numero_lote} de "${nombreProducto}" vence ` +
            `${dias === 0 ? 'HOY' : `en ${dias} día(s)`} ` +
            `(${formatearFecha(lote.fecha_vencimiento)}), con ${stockLegible} en riesgo.`,
        });
      }
    }

    // ---- (b) Alertas activas actualmente guardadas -----------------------
    const { data: activas, error: errorActivas } = await this.supabase.cliente
      .from('alertas')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('estado', EstadoAlerta.ACTIVA);
    this.supabase.verificarError(errorActivas, 'consultar las alertas activas');

    // ---- (c) Reconciliación -----------------------------------------------
    let creadas = 0;
    let actualizadas = 0;
    const idsParaResolver: string[] = [];
    const clavesYaExistentes = new Set<string>();

    for (const alerta of (activas ?? []) as Alerta[]) {
      const claveAlerta = clave(alerta.tipo, alerta.producto_id, alerta.lote_id);
      const deseada = deseadas.get(claveAlerta);

      if (!deseada) {
        // La condición ya no se cumple -> se resuelve automáticamente
        idsParaResolver.push(alerta.id);
      } else {
        clavesYaExistentes.add(claveAlerta);
        if (deseada.mensaje !== alerta.mensaje) {
          // Cambió el detalle (ej. ahora quedan menos días) -> refrescar
          await this.supabase.cliente
            .from('alertas')
            .update({ mensaje: deseada.mensaje })
            .eq('id', alerta.id);
          actualizadas++;
        }
      }
    }

    if (idsParaResolver.length > 0) {
      await this.supabase.cliente
        .from('alertas')
        .update({ estado: EstadoAlerta.RESUELTA, resuelto_en: new Date().toISOString() })
        .in('id', idsParaResolver);
    }

    const nuevas = [...deseadas.entries()]
      .filter(([claveDeseada]) => !clavesYaExistentes.has(claveDeseada))
      .map(([, deseada]) => ({ botica_id: boticaId, ...deseada }));

    if (nuevas.length > 0) {
      const { error: errorInsertar } = await this.supabase.cliente
        .from('alertas')
        .insert(nuevas);
      this.supabase.verificarError(errorInsertar, 'crear las alertas nuevas');
      creadas = nuevas.length;
    }

    return {
      creadas,
      actualizadas,
      resueltas: idsParaResolver.length,
      vigentes: deseadas.size,
    };
  }

  /**
   * Tarea programada: recalcula las alertas de TODAS las boticas activas
   * cada hora. Los usuarios también pueden forzarlo con POST /api/alertas/generar.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async generarAlertasTodasLasBoticas(): Promise<void> {
    const { data: boticas } = await this.supabase.cliente
      .from('boticas')
      .select('id, nombre')
      .eq('activa', true);

    for (const botica of boticas ?? []) {
      try {
        const resumen = await this.generarAlertas(botica.id);
        this.registrador.log(
          `Alertas de "${botica.nombre}": ${resumen.creadas} creadas, ` +
            `${resumen.resueltas} resueltas, ${resumen.vigentes} vigentes`,
        );
      } catch (error) {
        this.registrador.error(`Fallo al generar alertas de "${botica.nombre}"`, error);
      }
    }
  }

  // ============================================================
  // CONSULTA Y GESTIÓN
  // ============================================================

  async listar(
    boticaId: string,
    filtros: { estado?: EstadoAlerta; tipo?: TipoAlerta },
  ): Promise<AlertaDetallada[]> {
    let consulta = this.supabase.cliente
      .from('alertas')
      .select('*, producto:productos(nombre), lote:lotes(numero_lote, fecha_vencimiento)')
      .eq('botica_id', boticaId)
      .order('creado_en', { ascending: false })
      .limit(200);

    if (filtros.estado) consulta = consulta.eq('estado', filtros.estado);
    if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo);

    const { data, error } = await consulta;
    this.supabase.verificarError(error, 'listar las alertas');
    return (data ?? []) as unknown as AlertaDetallada[];
  }

  /** Contadores para la campanita de notificaciones del encabezado. */
  async contarActivas(boticaId: string): Promise<ContadorAlertas> {
    const { count: activas } = await this.supabase.cliente
      .from('alertas')
      .select('id', { count: 'exact', head: true })
      .eq('botica_id', boticaId)
      .eq('estado', EstadoAlerta.ACTIVA);

    const { count: noLeidas } = await this.supabase.cliente
      .from('alertas')
      .select('id', { count: 'exact', head: true })
      .eq('botica_id', boticaId)
      .eq('estado', EstadoAlerta.ACTIVA)
      .eq('leida', false);

    return { activas: activas ?? 0, noLeidas: noLeidas ?? 0 };
  }

  /** Marca una alerta como leída (no la resuelve: la condición sigue). */
  async marcarLeida(boticaId: string, alertaId: string): Promise<Alerta> {
    const { data, error } = await this.supabase.cliente
      .from('alertas')
      .update({ leida: true })
      .eq('botica_id', boticaId)
      .eq('id', alertaId)
      .select()
      .maybeSingle();
    this.supabase.verificarError(error, 'marcar la alerta como leída');
    if (!data) throw new NotFoundException('Alerta no encontrada en esta botica');
    return data as Alerta;
  }

  /** Resuelve una alerta manualmente. */
  async resolver(boticaId: string, alertaId: string): Promise<Alerta> {
    const { data, error } = await this.supabase.cliente
      .from('alertas')
      .update({
        estado: EstadoAlerta.RESUELTA,
        leida: true,
        resuelto_en: new Date().toISOString(),
      })
      .eq('botica_id', boticaId)
      .eq('id', alertaId)
      .select()
      .maybeSingle();
    this.supabase.verificarError(error, 'resolver la alerta');
    if (!data) throw new NotFoundException('Alerta no encontrada en esta botica');
    return data as Alerta;
  }
}
