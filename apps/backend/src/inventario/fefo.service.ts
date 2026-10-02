import { BadRequestException, Injectable } from '@nestjs/common';
import { DetalleDespacho, Lote, UnidadEmpaque, formatearStock } from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';

/** Estado de existencias de un lote (las dos columnas que cambian). */
export interface EstadoLote {
  cajas_completas: number;
  blisters_sueltos: number;
}

/** Resultado de descontar mercadería de un lote. */
export interface ResultadoDescuento extends EstadoLote {
  /** Cajas cerradas que salieron completas del lote. */
  cajasConsumidas: number;
  /** Cajas que hubo que ABRIR para poder entregar blísters sueltos. */
  cajasAbiertas: number;
  /** Total retirado, expresado en blísters. */
  blistersTomados: number;
}

/**
 * ════════════════════════════════════════════════════════════════
 *  REGLA DE APERTURA AUTOMÁTICA DE CAJAS  (función pura, sin base de datos)
 * ════════════════════════════════════════════════════════════════
 *
 * Calcula cómo queda un lote tras retirar `cantidad` unidades de él.
 * Es una función PURA: recibe el estado actual y devuelve el nuevo, sin
 * tocar la base de datos. Así la regla de negocio se puede razonar (y
 * explicar en la sustentación) de forma aislada, y la reutilizan tanto
 * las ventas del POS como el registro de mermas.
 *
 * MODELO DE STOCK
 *   cajas_completas  -> cajas cerradas, sin abrir
 *   blisters_sueltos -> blísters de una caja que ya fue abierta
 *   stock (blísters) = cajas_completas * unidadesPorCaja + blisters_sueltos
 *
 * COMPORTAMIENTO SEGÚN LA UNIDAD PEDIDA
 *   CAJA    -> se toman cajas cerradas. No se rearma una caja juntando
 *              blísters sueltos, porque ese empaque ya no existe físicamente.
 *   BLISTER -> se consumen primero los blísters sueltos; si no alcanzan, se
 *              ABRE una caja (cajas_completas - 1, blisters_sueltos +
 *              unidadesPorCaja) y se sigue tomando de ahí. Vender 1 blíster
 *              sin sueltos disponibles deja, por tanto, `unidadesPorCaja - 1`
 *              blísters libres; cuando esos se agotan, la caja quedó
 *              consumida por completo.
 *
 * @returns El nuevo estado del lote, o `null` si el lote no tiene suficiente.
 */
export function descontarDeLote(
  estado: EstadoLote,
  cantidad: number,
  unidad: UnidadEmpaque,
  unidadesPorCaja: number,
): ResultadoDescuento | null {
  const porCaja = Math.max(unidadesPorCaja, 1);
  let cajas = estado.cajas_completas;
  let sueltos = estado.blisters_sueltos;

  if (unidad === UnidadEmpaque.CAJA) {
    if (cajas < cantidad) return null;
    cajas -= cantidad;
    return {
      cajas_completas: cajas,
      blisters_sueltos: sueltos,
      cajasConsumidas: cantidad,
      cajasAbiertas: 0,
      blistersTomados: cantidad * porCaja,
    };
  }

  // --- Modalidad BLÍSTER ---
  const disponible = cajas * porCaja + sueltos;
  if (disponible < cantidad) return null;

  let porTomar = cantidad;
  let cajasAbiertas = 0;

  // 1) Consumir los blísters que ya estaban sueltos
  const deSueltos = Math.min(sueltos, porTomar);
  sueltos -= deSueltos;
  porTomar -= deSueltos;

  // 2) Si aún falta, abrir cajas de una en una
  while (porTomar > 0) {
    cajas -= 1; // se abre una caja cerrada...
    sueltos += porCaja; // ...y sus blísters pasan a estar sueltos
    cajasAbiertas += 1;

    const usar = Math.min(sueltos, porTomar);
    sueltos -= usar;
    porTomar -= usar;
  }

  return {
    cajas_completas: cajas,
    blisters_sueltos: sueltos,
    cajasConsumidas: 0,
    cajasAbiertas,
    blistersTomados: cantidad,
  };
}

/** Datos mínimos del producto que necesita el algoritmo FEFO. */
interface ProductoDespacho {
  id: string;
  nombre: string;
  unidades_por_caja: number;
}

/**
 * ════════════════════════════════════════════════════════════════
 *  SERVICIO FEFO  (First Expired, First Out — primero en vencer, primero en salir)
 * ════════════════════════════════════════════════════════════════
 *
 * Decide DE QUÉ LOTES sale la mercadería de una venta, empezando siempre
 * por el que vence antes, y aplica sobre cada lote la regla de apertura de
 * cajas implementada arriba.
 *
 * NOTA ACADÉMICA: en producción, los pasos 3 y 4 irían dentro de una
 * transacción de base de datos (función RPC de PostgreSQL) para garantizar
 * atomicidad ante ventas simultáneas. Aquí se resuelven en la capa de
 * aplicación para que el algoritmo quede legible paso a paso.
 */
@Injectable()
export class FefoService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Despacha `cantidad` unidades del producto aplicando FEFO.
   * Devuelve el detalle de qué salió de cada lote (incluidas las cajas que
   * hubo que abrir), que el POS muestra como evidencia del algoritmo.
   */
  async despachar(
    boticaId: string,
    producto: ProductoDespacho,
    cantidad: number,
    unidad: UnidadEmpaque,
  ): Promise<DetalleDespacho[]> {
    const porCaja = Math.max(producto.unidades_por_caja, 1);

    // ---- PASO 1: lotes disponibles ordenados por vencimiento -------------
    // El filtro por fecha excluye los lotes vencidos: nunca se despacha
    // mercadería vencida, aunque figure con existencias en el sistema.
    const hoy = new Date().toISOString().slice(0, 10);
    const { data, error } = await this.supabase.cliente
      .from('lotes')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('producto_id', producto.id)
      .gte('fecha_vencimiento', hoy)
      .order('fecha_vencimiento', { ascending: true }) // <- el corazón de FEFO
      .order('creado_en', { ascending: true }); // desempate: el más antiguo primero
    this.supabase.verificarError(error, 'consultar los lotes disponibles');

    const lotes = ((data ?? []) as Lote[]).filter(
      (lote) => lote.cajas_completas > 0 || lote.blisters_sueltos > 0,
    );

    // ---- PASO 2: validar que alcance el stock ----------------------------
    if (unidad === UnidadEmpaque.CAJA) {
      const cajasDisponibles = lotes.reduce((suma, lote) => suma + lote.cajas_completas, 0);
      if (cajasDisponibles < cantidad) {
        throw new BadRequestException(
          `Stock insuficiente de "${producto.nombre}": hay ${cajasDisponibles} caja(s) ` +
            `cerrada(s) disponible(s) y se solicitaron ${cantidad}.`,
        );
      }
    } else {
      const blistersDisponibles = lotes.reduce(
        (suma, lote) => suma + lote.cajas_completas * porCaja + lote.blisters_sueltos,
        0,
      );
      if (blistersDisponibles < cantidad) {
        throw new BadRequestException(
          `Stock insuficiente de "${producto.nombre}": hay ` +
            `${formatearStock(blistersDisponibles, porCaja)} y se solicitaron ` +
            `${cantidad} blíster(es).`,
        );
      }
    }

    // ---- PASO 3: repartir el pedido entre los lotes, en orden FEFO -------
    const detalle: DetalleDespacho[] = [];
    // Los cambios se acumulan y se aplican al final, para no dejar lotes a
    // medio actualizar si algo fallara a mitad del recorrido.
    const cambios: (EstadoLote & { id: string })[] = [];
    let pendiente = cantidad;

    for (const lote of lotes) {
      if (pendiente === 0) break;

      // Cuánto se puede tomar de ESTE lote (nunca más de lo que le queda).
      const disponibleEnLote =
        unidad === UnidadEmpaque.CAJA
          ? lote.cajas_completas
          : lote.cajas_completas * porCaja + lote.blisters_sueltos;
      const tomar = Math.min(disponibleEnLote, pendiente);
      if (tomar === 0) continue;

      const resultado = descontarDeLote(lote, tomar, unidad, porCaja);
      if (!resultado) continue; // no debería ocurrir: `tomar` ya está acotado

      cambios.push({
        id: lote.id,
        cajas_completas: resultado.cajas_completas,
        blisters_sueltos: resultado.blisters_sueltos,
      });
      detalle.push({
        loteId: lote.id,
        numeroLote: lote.numero_lote,
        fechaVencimiento: lote.fecha_vencimiento,
        blistersTomados: resultado.blistersTomados,
        cajasConsumidas: resultado.cajasConsumidas,
        cajasAbiertas: resultado.cajasAbiertas,
      });
      pendiente -= tomar;
    }

    // Salvaguarda: con las validaciones del paso 2 no debería ocurrir.
    if (pendiente > 0) {
      throw new BadRequestException(
        `No se pudo completar el despacho de "${producto.nombre}": ` +
          `faltaron ${pendiente} unidad(es).`,
      );
    }

    // ---- PASO 4: aplicar los descuentos en la base de datos --------------
    for (const cambio of cambios) {
      const { error: errorActualizar } = await this.supabase.cliente
        .from('lotes')
        .update({
          cajas_completas: cambio.cajas_completas,
          blisters_sueltos: cambio.blisters_sueltos,
        })
        .eq('id', cambio.id)
        .eq('botica_id', boticaId);
      this.supabase.verificarError(errorActualizar, 'descontar el stock del lote');
    }

    return detalle;
  }
}
