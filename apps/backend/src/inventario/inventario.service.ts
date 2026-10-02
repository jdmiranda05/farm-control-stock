import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Lote,
  LoteDetallado,
  RespuestaPaginada,
  TipoMovimientoKardex,
  UnidadEmpaque,
  formatearFecha,
} from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';
import { KardexService } from '../kardex/kardex.service';
import { armarRespuestaPaginada, calcularRango } from '../comun/dto/paginacion.dto';
import { descontarDeLote } from './fefo.service';
import { RegistrarEntradaDto } from './dto/registrar-entrada.dto';
import { RegistrarMermaDto } from './dto/registrar-merma.dto';
import { FiltroLotesDto } from './dto/filtro-lotes.dto';

/**
 * Lógica del almacén: recepción de mercadería (entradas manuales),
 * declaración de mermas y consulta de lotes.
 *
 * Las SALIDAS POR VENTA no se manejan aquí, sino en el módulo `ventas`,
 * porque son automáticas: las dispara el punto de venta.
 */
@Injectable()
export class InventarioService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly kardex: KardexService,
  ) {}

  // ============================================================
  // CONSULTA DE LOTES (paginada)
  // ============================================================

  async listarLotes(
    boticaId: string,
    filtros: FiltroLotesDto,
  ): Promise<RespuestaPaginada<LoteDetallado>> {
    const { pagina, porPagina, desde, hasta } = calcularRango(filtros);
    const hoy = new Date().toISOString().slice(0, 10);

    let consulta = this.supabase.cliente
      .from('lotes')
      .select(
        '*, producto:productos(id, nombre, codigo, unidades_por_caja), proveedor:proveedores(id, nombre)',
        { count: 'exact' },
      )
      .eq('botica_id', boticaId);

    if (filtros.productoId) consulta = consulta.eq('producto_id', filtros.productoId);
    if (filtros.soloVencidos === 'true') consulta = consulta.lt('fecha_vencimiento', hoy);

    const { data, error, count } = await consulta
      // Orden FEFO también en la pantalla: lo que vence antes se ve primero.
      .order('fecha_vencimiento', { ascending: true })
      .range(desde, hasta);
    this.supabase.verificarError(error, 'listar los lotes');

    return armarRespuestaPaginada(
      (data ?? []) as unknown as LoteDetallado[],
      count ?? 0,
      pagina,
      porPagina,
    );
  }

  // ============================================================
  // ENTRADA MANUAL DE MERCADERÍA
  // ============================================================

  /**
   * Registra la recepción de una compra:
   *  - Si el (producto, número de lote) ya existe, suma las cajas recibidas.
   *  - Si no existe, crea el lote con su fecha de vencimiento y proveedor.
   *  - Siempre deja constancia en el kardex como ENTRADA_MANUAL.
   */
  async registrarEntrada(
    boticaId: string,
    usuarioId: string,
    dto: RegistrarEntradaDto,
  ): Promise<Lote> {
    // 1) El producto debe existir, pertenecer a la botica y estar activo
    const { data: producto } = await this.supabase.cliente
      .from('productos')
      .select('id, nombre, unidades_por_caja, activo')
      .eq('botica_id', boticaId)
      .eq('id', dto.productoId)
      .maybeSingle();
    if (!producto) throw new NotFoundException('Producto no encontrado en esta botica');
    if (!producto.activo) {
      throw new BadRequestException(
        `El producto "${producto.nombre}" está desactivado. ` +
          'Un administrador debe reactivarlo antes de recibir mercadería.',
      );
    }

    // 2) El proveedor (si se indicó) también debe ser de esta botica
    if (dto.proveedorId) {
      const { data: proveedor } = await this.supabase.cliente
        .from('proveedores')
        .select('id')
        .eq('botica_id', boticaId)
        .eq('id', dto.proveedorId)
        .maybeSingle();
      if (!proveedor) throw new NotFoundException('Proveedor no encontrado en esta botica');
    }

    // 3) ¿Ya existe ese número de lote para el producto?
    const { data: loteExistente } = await this.supabase.cliente
      .from('lotes')
      .select('*')
      .eq('producto_id', dto.productoId)
      .eq('numero_lote', dto.numeroLote)
      .maybeSingle();

    let lote: Lote;

    if (loteExistente) {
      // Coherencia: un mismo número de lote no puede cambiar de vencimiento.
      if (loteExistente.fecha_vencimiento !== dto.fechaVencimiento) {
        throw new BadRequestException(
          `El lote ${dto.numeroLote} ya está registrado con vencimiento ` +
            `${formatearFecha(loteExistente.fecha_vencimiento)}, que no coincide con ` +
            `el indicado (${formatearFecha(dto.fechaVencimiento)}).`,
        );
      }
      const { data, error } = await this.supabase.cliente
        .from('lotes')
        .update({
          cajas_completas: loteExistente.cajas_completas + dto.cantidadCajas,
          cajas_iniciales: loteExistente.cajas_iniciales + dto.cantidadCajas,
          costo_caja: dto.costoCaja, // se actualiza al costo de la última compra
        })
        .eq('id', loteExistente.id)
        .select()
        .single();
      this.supabase.verificarError(error, 'actualizar el lote existente');
      lote = data as Lote;
    } else {
      const { data, error } = await this.supabase.cliente
        .from('lotes')
        .insert({
          botica_id: boticaId,
          producto_id: dto.productoId,
          proveedor_id: dto.proveedorId ?? null,
          numero_lote: dto.numeroLote,
          fecha_vencimiento: dto.fechaVencimiento,
          cajas_iniciales: dto.cantidadCajas,
          cajas_completas: dto.cantidadCajas,
          blisters_sueltos: 0,
          costo_caja: dto.costoCaja,
        })
        .select()
        .single();
      this.supabase.verificarError(error, 'crear el lote');
      lote = data as Lote;
    }

    // 4) Registrar la entrada en el kardex, valorizada al costo de compra
    await this.kardex.registrar({
      boticaId,
      productoId: dto.productoId,
      loteId: lote.id,
      proveedorId: dto.proveedorId ?? null,
      usuarioId,
      tipo: TipoMovimientoKardex.ENTRADA_MANUAL,
      cantidad: dto.cantidadCajas,
      unidad: UnidadEmpaque.CAJA,
      cantidadBlisters: dto.cantidadCajas * Math.max(producto.unidades_por_caja, 1),
      valorSoles: dto.cantidadCajas * dto.costoCaja,
      motivo: `Recepción de mercadería — lote ${dto.numeroLote}`,
    });

    return lote;
  }

  // ============================================================
  // MERMA (pérdida económica)
  // ============================================================

  /**
   * Declara una pérdida sobre un lote concreto y la valoriza en soles.
   *
   * Fórmula (requisito del proyecto):
   *   merma_soles = cantidad_en_blisters * costo_compra_unitario
   *   donde costo_compra_unitario = costo_caja / unidades_por_caja
   *
   * A diferencia de una venta, aquí NO se aplica FEFO: el almacenero retira
   * físicamente la mercadería de un lote determinado (el vencido o dañado).
   */
  async registrarMerma(
    boticaId: string,
    usuarioId: string,
    dto: RegistrarMermaDto,
  ): Promise<{
    mensaje: string;
    valorMermaSoles: number;
    blistersRetirados: number;
  }> {
    // 1) Traer el lote junto con los datos de empaque de su producto
    const { data: lote } = await this.supabase.cliente
      .from('lotes')
      .select('*, producto:productos(id, nombre, unidades_por_caja)')
      .eq('botica_id', boticaId)
      .eq('id', dto.loteId)
      .maybeSingle();
    if (!lote) throw new NotFoundException('Lote no encontrado en esta botica');

    const porCaja = Math.max(lote.producto?.unidades_por_caja ?? 1, 1);

    // 2) Descontar del lote con la MISMA regla de apertura de cajas que usan
    //    las ventas (función compartida en fefo.service.ts).
    const resultado = descontarDeLote(lote, dto.cantidad, dto.unidad, porCaja);
    if (!resultado) {
      const disponible = lote.cajas_completas * porCaja + lote.blisters_sueltos;
      throw new BadRequestException(
        `El lote ${lote.numero_lote} no tiene suficiente mercadería: ` +
          `quedan ${lote.cajas_completas} caja(s) y ${lote.blisters_sueltos} blíster(es) ` +
          `(${disponible} en total).`,
      );
    }

    const { error: errorActualizar } = await this.supabase.cliente
      .from('lotes')
      .update({
        cajas_completas: resultado.cajas_completas,
        blisters_sueltos: resultado.blisters_sueltos,
      })
      .eq('id', lote.id)
      .eq('botica_id', boticaId);
    this.supabase.verificarError(errorActualizar, 'descontar la merma del lote');

    // 3) Valorizar la pérdida al COSTO de compra (no al precio de venta:
    //    la botica pierde lo que le costó la mercadería).
    const costoPorBlister = Number(lote.costo_caja) / porCaja;
    const valorMermaSoles = Number((resultado.blistersTomados * costoPorBlister).toFixed(2));

    // 4) Dejar constancia en el kardex
    await this.kardex.registrar({
      boticaId,
      productoId: lote.producto_id,
      loteId: lote.id,
      proveedorId: lote.proveedor_id,
      usuarioId,
      tipo: TipoMovimientoKardex.SALIDA_MERMA,
      cantidad: dto.cantidad,
      unidad: dto.unidad,
      cantidadBlisters: resultado.blistersTomados,
      valorSoles: valorMermaSoles,
      motivo: `${dto.motivo} — lote ${lote.numero_lote}`,
    });

    return {
      mensaje:
        `Merma registrada: se retiraron ${resultado.blistersTomados} blíster(es) de ` +
        `"${lote.producto?.nombre}" (lote ${lote.numero_lote}).`,
      valorMermaSoles,
      blistersRetirados: resultado.blistersTomados,
    };
  }
}
