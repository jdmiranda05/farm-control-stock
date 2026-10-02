import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DetalleDespacho,
  RespuestaPaginada,
  ResultadoVenta,
  TipoMovimientoKardex,
  UnidadEmpaque,
  VentaDetallada,
  formatearStock,
} from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';
import { FefoService } from '../inventario/fefo.service';
import { KardexService } from '../kardex/kardex.service';
import { armarRespuestaPaginada, calcularRango } from '../comun/dto/paginacion.dto';
import { PaginacionDto } from '../comun/dto/paginacion.dto';
import { LineaVentaDto, RegistrarVentaDto } from './dto/registrar-venta.dto';

/** Línea ya validada y valorizada, lista para descontarse del stock. */
interface LineaPreparada {
  linea: LineaVentaDto;
  producto: {
    id: string;
    nombre: string;
    unidades_por_caja: number;
    precio_caja: number;
    precio_blister: number;
    activo: boolean;
  };
  precioUnitario: number;
  subtotal: number;
}

/**
 * ════════════════════════════════════════════════════════════════
 *  SERVICIO DE VENTAS (punto de venta / POS)
 * ════════════════════════════════════════════════════════════════
 *
 * Regla central del proyecto: las salidas del almacén por venta son
 * AUTOMÁTICAS. El vendedor solo indica producto, modalidad (caja o blíster)
 * y cantidad; el sistema se encarga de:
 *   1. valorizar la venta con el precio que corresponda,
 *   2. elegir los lotes con FEFO (primero el que vence antes),
 *   3. abrir cajas automáticamente cuando se venden blísters sueltos,
 *   4. registrar el comprobante y sus movimientos en el kardex.
 */
@Injectable()
export class VentasService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly fefo: FefoService,
    private readonly kardex: KardexService,
  ) {}

  /**
   * Registra una venta completa.
   *
   * NOTA ACADÉMICA sobre transacciones: el flujo valida TODO antes de tocar
   * la base de datos (paso 1), de modo que si algo está mal —producto
   * inexistente, stock insuficiente— la venta se rechaza sin haber
   * modificado nada. En un sistema en producción, los pasos 2 a 4 irían
   * además dentro de una transacción de PostgreSQL para ser atómicos.
   */
  async registrar(
    boticaId: string,
    usuarioId: string,
    dto: RegistrarVentaDto,
  ): Promise<ResultadoVenta> {
    // ---- PASO 1: validar y valorizar todas las líneas --------------------
    const preparadas: LineaPreparada[] = [];

    for (const linea of dto.lineas) {
      const { data: producto } = await this.supabase.cliente
        .from('productos')
        .select('id, nombre, unidades_por_caja, precio_caja, precio_blister, activo')
        .eq('botica_id', boticaId)
        .eq('id', linea.productoId)
        .maybeSingle();

      if (!producto) {
        throw new NotFoundException(`Producto no encontrado en esta botica`);
      }
      if (!producto.activo) {
        throw new BadRequestException(
          `El producto "${producto.nombre}" está desactivado y no se puede vender.`,
        );
      }

      // El precio depende de la modalidad elegida por el vendedor.
      const precioUnitario =
        linea.modalidad === UnidadEmpaque.CAJA
          ? Number(producto.precio_caja)
          : Number(producto.precio_blister);

      if (precioUnitario <= 0) {
        throw new BadRequestException(
          `El producto "${producto.nombre}" no tiene precio configurado para la ` +
            `modalidad ${linea.modalidad}. Regístrelo en Productos antes de venderlo.`,
        );
      }

      preparadas.push({
        linea,
        producto,
        precioUnitario,
        subtotal: Number((precioUnitario * linea.cantidad).toFixed(2)),
      });
    }

    // Verificación previa de stock: si algo no alcanza, se aborta ANTES
    // de crear el comprobante y de descontar cualquier lote.
    await this.verificarStockSuficiente(boticaId, preparadas);

    const totalSoles = Number(
      preparadas.reduce((suma, item) => suma + item.subtotal, 0).toFixed(2),
    );

    // ---- PASO 2: crear la cabecera del comprobante -----------------------
    const numeroComprobante = await this.generarNumeroComprobante(boticaId);
    const { data: venta, error: errorVenta } = await this.supabase.cliente
      .from('ventas')
      .insert({
        botica_id: boticaId,
        usuario_id: usuarioId,
        numero_comprobante: numeroComprobante,
        total_soles: totalSoles,
      })
      .select()
      .single();
    this.supabase.verificarError(errorVenta, 'registrar la venta');

    // ---- PASOS 3 y 4: despachar con FEFO y registrar el historial --------
    const lineasResultado: ResultadoVenta['lineas'] = [];

    for (const item of preparadas) {
      // 3) Descontar del stock aplicando FEFO (abre cajas si hace falta)
      const despacho: DetalleDespacho[] = await this.fefo.despachar(
        boticaId,
        item.producto,
        item.linea.cantidad,
        item.linea.modalidad,
      );

      // 4) Guardar la línea del comprobante
      const { error: errorDetalle } = await this.supabase.cliente
        .from('detalles_venta')
        .insert({
          venta_id: venta.id,
          producto_id: item.producto.id,
          modalidad: item.linea.modalidad,
          cantidad: item.linea.cantidad,
          precio_unitario: item.precioUnitario,
          subtotal: item.subtotal,
        });
      this.supabase.verificarError(errorDetalle, 'registrar el detalle de la venta');

      // 5) Un movimiento de kardex POR CADA LOTE afectado: así el historial
      //    muestra exactamente de dónde salió cada unidad (trazabilidad).
      const totalBlisters = despacho.reduce((suma, d) => suma + d.blistersTomados, 0);
      for (const tramo of despacho) {
        // La venta se reparte proporcionalmente entre los lotes usados.
        const proporcion = totalBlisters > 0 ? tramo.blistersTomados / totalBlisters : 1;
        const cantidadEnUnidad =
          item.linea.modalidad === UnidadEmpaque.CAJA
            ? tramo.cajasConsumidas
            : tramo.blistersTomados;

        await this.kardex.registrar({
          boticaId,
          productoId: item.producto.id,
          loteId: tramo.loteId,
          ventaId: venta.id,
          usuarioId,
          tipo: TipoMovimientoKardex.SALIDA_VENTA,
          cantidad: Math.max(cantidadEnUnidad, 1),
          unidad: item.linea.modalidad,
          cantidadBlisters: tramo.blistersTomados,
          valorSoles: Number((item.subtotal * proporcion).toFixed(2)),
          motivo:
            `Venta ${numeroComprobante} — lote ${tramo.numeroLote}` +
            (tramo.cajasAbiertas > 0
              ? ` (se abrió ${tramo.cajasAbiertas} caja(s) para vender blísters)`
              : ''),
        });
      }

      lineasResultado.push({
        productoId: item.producto.id,
        productoNombre: item.producto.nombre,
        modalidad: item.linea.modalidad,
        cantidad: item.linea.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
        despacho,
      });
    }

    return {
      ventaId: venta.id,
      numeroComprobante,
      totalSoles,
      fecha: venta.creado_en,
      lineas: lineasResultado,
    };
  }

  /**
   * Comprueba que cada línea tenga stock antes de tocar nada.
   *
   * Importante: agrupa por producto y modalidad, porque si el carrito lleva
   * dos líneas del mismo medicamento, lo que hay que validar es la SUMA
   * de ambas contra el stock disponible.
   */
  private async verificarStockSuficiente(
    boticaId: string,
    preparadas: LineaPreparada[],
  ): Promise<void> {
    const solicitado = new Map<string, { cajas: number; blisters: number }>();
    for (const item of preparadas) {
      const acumulado = solicitado.get(item.producto.id) ?? { cajas: 0, blisters: 0 };
      if (item.linea.modalidad === UnidadEmpaque.CAJA) {
        acumulado.cajas += item.linea.cantidad;
      } else {
        acumulado.blisters += item.linea.cantidad;
      }
      solicitado.set(item.producto.id, acumulado);
    }

    const hoy = new Date().toISOString().slice(0, 10);

    for (const [productoId, pedido] of solicitado) {
      const producto = preparadas.find((item) => item.producto.id === productoId)!.producto;
      const porCaja = Math.max(producto.unidades_por_caja, 1);

      const { data: lotes } = await this.supabase.cliente
        .from('lotes')
        .select('cajas_completas, blisters_sueltos')
        .eq('botica_id', boticaId)
        .eq('producto_id', productoId)
        .gte('fecha_vencimiento', hoy);

      const cajasDisponibles = (lotes ?? []).reduce((s, l) => s + l.cajas_completas, 0);
      const blistersDisponibles = (lotes ?? []).reduce(
        (s, l) => s + l.cajas_completas * porCaja + l.blisters_sueltos,
        0,
      );

      // Vender por caja exige cajas cerradas.
      if (pedido.cajas > cajasDisponibles) {
        throw new BadRequestException(
          `Stock insuficiente de "${producto.nombre}": hay ${cajasDisponibles} caja(s) ` +
            `cerrada(s) y se solicitaron ${pedido.cajas}.`,
        );
      }
      // Y el total pedido (cajas convertidas + blísters) debe caber en el stock.
      const totalBlistersPedidos = pedido.cajas * porCaja + pedido.blisters;
      if (totalBlistersPedidos > blistersDisponibles) {
        throw new BadRequestException(
          `Stock insuficiente de "${producto.nombre}": hay ` +
            `${formatearStock(blistersDisponibles, porCaja)} y se solicitaron ` +
            `${totalBlistersPedidos} blíster(es) en total.`,
        );
      }
    }
  }

  /** Genera el correlativo del comprobante: V-000001, V-000002, ... */
  private async generarNumeroComprobante(boticaId: string): Promise<string> {
    const { count } = await this.supabase.cliente
      .from('ventas')
      .select('id', { count: 'exact', head: true })
      .eq('botica_id', boticaId);

    let correlativo = (count ?? 0) + 1;

    // Si el número ya existiera (por ventas simultáneas), se busca el
    // siguiente libre. La restricción UNIQUE de la tabla es la garantía final.
    for (let intento = 0; intento < 50; intento++) {
      const numero = `V-${String(correlativo).padStart(6, '0')}`;
      const { data: existente } = await this.supabase.cliente
        .from('ventas')
        .select('id')
        .eq('botica_id', boticaId)
        .eq('numero_comprobante', numero)
        .maybeSingle();
      if (!existente) return numero;
      correlativo++;
    }
    // Salida de emergencia: sufijo con la marca de tiempo.
    return `V-${Date.now()}`;
  }

  /** Historial de ventas paginado (con sus líneas y el vendedor). */
  async listar(
    boticaId: string,
    paginacion: PaginacionDto,
  ): Promise<RespuestaPaginada<VentaDetallada>> {
    const { pagina, porPagina, desde, hasta } = calcularRango(paginacion);

    const { data, error, count } = await this.supabase.cliente
      .from('ventas')
      .select(
        '*, usuario:usuarios(nombre_completo), detalles:detalles_venta(*, producto:productos(nombre))',
        { count: 'exact' },
      )
      .eq('botica_id', boticaId)
      .order('creado_en', { ascending: false })
      .range(desde, hasta);
    this.supabase.verificarError(error, 'listar las ventas');

    return armarRespuestaPaginada(
      (data ?? []) as unknown as VentaDetallada[],
      count ?? 0,
      pagina,
      porPagina,
    );
  }
}
