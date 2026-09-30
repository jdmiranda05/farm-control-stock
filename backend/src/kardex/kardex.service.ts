import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MovimientoDetallado,
  MovimientoKardex,
  RespuestaPaginada,
  TipoMovimientoKardex,
  UnidadEmpaque,
} from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';
import { armarRespuestaPaginada, calcularRango } from '../comun/dto/paginacion.dto';
import { FiltroKardexDto } from './dto/filtro-kardex.dto';
import { CorregirMovimientoDto } from './dto/corregir-movimiento.dto';

/** Datos para registrar un movimiento nuevo en el historial. */
export interface DatosMovimiento {
  boticaId: string;
  productoId: string;
  loteId?: string | null;
  proveedorId?: string | null;
  ventaId?: string | null;
  usuarioId?: string | null;
  tipo: TipoMovimientoKardex;
  cantidad: number;
  unidad: UnidadEmpaque;
  cantidadBlisters: number;
  valorSoles: number;
  motivo?: string | null;
}

/**
 * Servicio del KARDEX: el libro de existencias de la botica.
 *
 * Toda operación que mueva stock (entrada manual, venta, merma, ajuste)
 * deja aquí su huella. Los demás módulos NO escriben en la tabla
 * `movimientos_kardex` directamente: llaman a `registrar()`, de modo que
 * el formato del historial queda centralizado en un solo lugar.
 */
@Injectable()
export class KardexService {
  /**
   * Columnas anidadas que necesitan las tablas del frontend.
   *
   * Nótese `usuarios!usuario_id`: la tabla `movimientos_kardex` tiene DOS
   * claves foráneas hacia `usuarios` (`usuario_id`, quien hizo el movimiento,
   * y `editado_por`, quien lo corrigió). Sin indicar por cuál se quiere hacer
   * el join, PostgREST no puede adivinarlo y responde
   * "more than one relationship was found".
   */
  private readonly SELECCION_DETALLADA =
    '*, producto:productos(nombre, codigo, activo), lote:lotes(numero_lote, fecha_vencimiento), ' +
    'proveedor:proveedores(nombre), usuario:usuarios!usuario_id(nombre_completo)';

  constructor(private readonly supabase: SupabaseService) {}

  /** Inserta un movimiento en el historial. */
  async registrar(datos: DatosMovimiento): Promise<MovimientoKardex> {
    const { data, error } = await this.supabase.cliente
      .from('movimientos_kardex')
      .insert({
        botica_id: datos.boticaId,
        producto_id: datos.productoId,
        lote_id: datos.loteId ?? null,
        proveedor_id: datos.proveedorId ?? null,
        venta_id: datos.ventaId ?? null,
        usuario_id: datos.usuarioId ?? null,
        tipo: datos.tipo,
        cantidad: datos.cantidad,
        unidad: datos.unidad,
        cantidad_blisters: datos.cantidadBlisters,
        valor_soles: Number(datos.valorSoles.toFixed(2)),
        motivo: datos.motivo ?? null,
      })
      .select()
      .single();
    this.supabase.verificarError(error, 'registrar el movimiento en el kardex');
    return data as MovimientoKardex;
  }

  /**
   * Listado paginado del historial con filtros por tipo, producto y fechas.
   * La paginación es del lado del SERVIDOR: Supabase devuelve solo la página
   * pedida (`.range`) más el total de registros (`count: 'exact'`), de modo
   * que el navegador nunca descarga miles de movimientos.
   */
  async listar(
    boticaId: string,
    filtros: FiltroKardexDto,
  ): Promise<RespuestaPaginada<MovimientoDetallado>> {
    const { pagina, porPagina, desde, hasta } = calcularRango(filtros);

    let consulta = this.supabase.cliente
      .from('movimientos_kardex')
      .select(this.SELECCION_DETALLADA, { count: 'exact' })
      .eq('botica_id', boticaId);

    if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo);
    if (filtros.productoId) consulta = consulta.eq('producto_id', filtros.productoId);
    // Las fechas llegan como AAAA-MM-DD; se convierten al instante inicial y
    // final del día para comparar contra la marca de tiempo `creado_en`.
    if (filtros.desde) consulta = consulta.gte('creado_en', `${filtros.desde}T00:00:00`);
    if (filtros.hasta) consulta = consulta.lte('creado_en', `${filtros.hasta}T23:59:59`);

    const { data, error, count } = await consulta
      .order('creado_en', { ascending: false })
      .range(desde, hasta);
    this.supabase.verificarError(error, 'listar el kardex');

    return armarRespuestaPaginada(
      (data ?? []) as unknown as MovimientoDetallado[],
      count ?? 0,
      pagina,
      porPagina,
    );
  }

  /**
   * CORREGIR un movimiento del historial. Solo el rol ADMIN.
   *
   * Importante para la sustentación: esta corrección modifica el REGISTRO
   * histórico (lo que quedó anotado), no el stock de los lotes. Si además
   * hubiera que corregir existencias, el almacenero registra un movimiento
   * de ajuste. El registro corregido queda marcado con `editado = true`,
   * junto con el usuario y la fecha, para conservar la trazabilidad.
   */
  async corregir(
    boticaId: string,
    movimientoId: string,
    usuarioId: string,
    dto: CorregirMovimientoDto,
  ): Promise<MovimientoKardex> {
    const { data: movimiento } = await this.supabase.cliente
      .from('movimientos_kardex')
      .select('*, producto:productos(unidades_por_caja)')
      .eq('botica_id', boticaId)
      .eq('id', movimientoId)
      .maybeSingle();
    if (!movimiento) throw new NotFoundException('Movimiento no encontrado en esta botica');

    const cambios: Record<string, unknown> = {
      motivo: dto.motivo,
      editado: true,
      editado_por: usuarioId,
      editado_en: new Date().toISOString(),
    };

    if (dto.cantidad !== undefined) {
      cambios.cantidad = dto.cantidad;
      // Al cambiar la cantidad hay que recalcular su equivalente en blísters,
      // porque los reportes suman siempre por esa columna normalizada.
      const unidadesPorCaja = Math.max(movimiento.producto?.unidades_por_caja ?? 1, 1);
      cambios.cantidad_blisters =
        movimiento.unidad === UnidadEmpaque.CAJA ? dto.cantidad * unidadesPorCaja : dto.cantidad;
    }
    if (dto.valorSoles !== undefined) cambios.valor_soles = dto.valorSoles;

    const { data, error } = await this.supabase.cliente
      .from('movimientos_kardex')
      .update(cambios)
      .eq('botica_id', boticaId)
      .eq('id', movimientoId)
      .select()
      .single();
    this.supabase.verificarError(error, 'corregir el movimiento');
    return data as MovimientoKardex;
  }

  /** Últimos movimientos de un producto (ficha de detalle). */
  async listarPorProducto(
    boticaId: string,
    productoId: string,
    limite = 20,
  ): Promise<MovimientoDetallado[]> {
    if (limite < 1 || limite > 100) {
      throw new BadRequestException('El límite debe estar entre 1 y 100');
    }
    const { data, error } = await this.supabase.cliente
      .from('movimientos_kardex')
      .select(this.SELECCION_DETALLADA)
      .eq('botica_id', boticaId)
      .eq('producto_id', productoId)
      .order('creado_en', { ascending: false })
      .limit(limite);
    this.supabase.verificarError(error, 'listar el historial del producto');
    return (data ?? []) as unknown as MovimientoDetallado[];
  }
}
