import {
  EstadoAlerta,
  EstadoSemaforo,
  RolUsuario,
  TipoAlerta,
  TipoMovimientoKardex,
  UnidadEmpaque,
} from './enumeraciones';

/**
 * Interfaces que reflejan las tablas de la base de datos (supabase/esquema.sql).
 * Se conservan los nombres de columna en snake_case, tal como los devuelve
 * PostgreSQL, para que el mapeo entre capas sea evidente en la sustentación.
 */

/** Tabla `boticas` — cada fila es un inquilino (tenant) del SaaS. */
export interface Botica {
  id: string;
  nombre: string;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  /** Días de anticipación con los que se alerta un vencimiento. */
  dias_alerta_vencimiento: number;
  activa: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Tabla `usuarios` — perfil vinculado a Supabase Auth (mismo UUID). */
export interface Usuario {
  id: string;
  botica_id: string;
  nombre_completo: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  creado_en: string;
}

/** Perfil completo que entrega el backend tras autenticarse (usuario + botica). */
export interface PerfilUsuario extends Usuario {
  botica: Botica | null;
}

/** Tabla `proveedores` — laboratorios y distribuidoras de la botica. */
export interface Proveedor {
  id: string;
  botica_id: string;
  nombre: string;
  ruc: string | null;
  telefono: string | null;
  contacto: string | null;
  activo: boolean;
  creado_en: string;
}

/** Tabla `categorias` — clasificación de productos, propia de cada botica. */
export interface Categoria {
  id: string;
  botica_id: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
}

/** Tabla `productos` — catálogo (el stock real vive en `lotes`). */
export interface Producto {
  id: string;
  botica_id: string;
  categoria_id: string | null;
  codigo: string | null;
  nombre: string;
  presentacion: string | null;
  laboratorio: string | null;
  requiere_receta: boolean;
  /** Cuántos blísters trae una caja (1 si el producto se vende por unidad). */
  unidades_por_caja: number;
  precio_caja: number;
  precio_blister: number;
  /** Umbral mínimo expresado en BLÍSTERS. */
  stock_minimo: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Tabla `lotes` — stock desglosado para poder representar la apertura de cajas:
 *   stock en blísters = cajas_completas * unidades_por_caja + blisters_sueltos
 */
export interface Lote {
  id: string;
  botica_id: string;
  producto_id: string;
  proveedor_id: string | null;
  numero_lote: string;
  /** Fecha de vencimiento en formato ISO `AAAA-MM-DD`. */
  fecha_vencimiento: string;
  cajas_iniciales: number;
  cajas_completas: number;
  blisters_sueltos: number;
  /** Costo de compra de UNA caja (base del cálculo de merma). */
  costo_caja: number;
  creado_en: string;
}

/** Lote con los datos anidados que muestran las tablas del frontend. */
export interface LoteDetallado extends Lote {
  producto: Pick<Producto, 'id' | 'nombre' | 'codigo' | 'unidades_por_caja'> | null;
  proveedor: Pick<Proveedor, 'id' | 'nombre'> | null;
}

/** Tabla `ventas` — cabecera del comprobante emitido en el POS. */
export interface Venta {
  id: string;
  botica_id: string;
  usuario_id: string | null;
  numero_comprobante: string;
  total_soles: number;
  creado_en: string;
}

/** Tabla `detalles_venta` — una línea del comprobante. */
export interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id: string;
  modalidad: UnidadEmpaque;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

/** Venta con sus líneas y el vendedor, para el historial. */
export interface VentaDetallada extends Venta {
  usuario: Pick<Usuario, 'nombre_completo'> | null;
  detalles: (DetalleVenta & { producto: Pick<Producto, 'nombre'> | null })[];
}

/** Tabla `movimientos_kardex` — historial completo de existencias. */
export interface MovimientoKardex {
  id: string;
  botica_id: string;
  producto_id: string;
  lote_id: string | null;
  proveedor_id: string | null;
  venta_id: string | null;
  usuario_id: string | null;
  tipo: TipoMovimientoKardex;
  /** Cantidad tal como la vio el usuario (ej. 3 CAJAS). */
  cantidad: number;
  unidad: UnidadEmpaque;
  /** La misma cantidad normalizada a blísters (para sumar y comparar). */
  cantidad_blisters: number;
  valor_soles: number;
  motivo: string | null;
  /** Verdadero si un ADMIN corrigió este registro. */
  editado: boolean;
  editado_por: string | null;
  editado_en: string | null;
  creado_en: string;
}

/** Movimiento con datos anidados para la tabla del Kardex. */
export interface MovimientoDetallado extends MovimientoKardex {
  producto: Pick<Producto, 'nombre' | 'codigo' | 'activo'> | null;
  lote: Pick<Lote, 'numero_lote' | 'fecha_vencimiento'> | null;
  proveedor: Pick<Proveedor, 'nombre'> | null;
  usuario: Pick<Usuario, 'nombre_completo'> | null;
}

/** Tabla `alertas` — notificaciones generadas por el motor de alertas. */
export interface Alerta {
  id: string;
  botica_id: string;
  tipo: TipoAlerta;
  producto_id: string | null;
  lote_id: string | null;
  mensaje: string;
  estado: EstadoAlerta;
  leida: boolean;
  creado_en: string;
  resuelto_en: string | null;
}

/** Alerta con datos anidados para mostrar en el frontend. */
export interface AlertaDetallada extends Alerta {
  producto: Pick<Producto, 'nombre'> | null;
  lote: Pick<Lote, 'numero_lote' | 'fecha_vencimiento'> | null;
}

/** Respuesta del endpoint GET /api/alertas/contador (campanita del header). */
export interface ContadorAlertas {
  activas: number;
  noLeidas: number;
}

/**
 * Fila de la vista `vista_stock_productos`: producto + stock consolidado
 * de sus lotes + los dos semáforos calculados en SQL.
 */
export interface ProductoConStock {
  id: string;
  botica_id: string;
  codigo: string | null;
  nombre: string;
  presentacion: string | null;
  laboratorio: string | null;
  categoria_id: string | null;
  categoria_nombre: string | null;
  unidades_por_caja: number;
  precio_caja: number;
  precio_blister: number;
  stock_minimo: number;
  requiere_receta: boolean;
  activo: boolean;
  /** Stock disponible en blísters (excluye lotes vencidos). */
  stock_blisters: number;
  cajas_disponibles: number;
  blisters_sueltos: number;
  /** Blísters atrapados en lotes ya vencidos. */
  blisters_vencidos: number;
  proxima_fecha_vencimiento: string | null;
  dias_para_vencer: number | null;
  /** Semáforo según stock vs. stock mínimo (requisito 5). */
  estado_stock: EstadoSemaforo;
  /** Semáforo según cercanía del vencimiento. */
  estado_vencimiento: EstadoSemaforo;
}

/** Fila de la vista `vista_merma_productos` — pérdidas económicas por producto. */
export interface MermaProducto {
  producto_id: string;
  botica_id: string;
  producto_nombre: string;
  codigo: string | null;
  /** Pérdidas ya declaradas como merma (movimientos SALIDA_MERMA). */
  merma_registrada_soles: number;
  blisters_merma_registrada: number;
  /** Mercadería vencida que sigue en almacén sin declararse. */
  blisters_vencidos_sin_declarar: number;
  merma_potencial_soles: number;
}

/** Respuesta del endpoint GET /api/reportes/merma. */
export interface ResumenMerma {
  totalRegistradaSoles: number;
  totalPotencialSoles: number;
  productos: MermaProducto[];
}

// ============================================================
// PAGINACIÓN
// ============================================================

/**
 * Envoltura estándar de toda respuesta paginada del servidor.
 * El backend devuelve solo la página solicitada + los metadatos que el
 * frontend necesita para pintar los controles "Anterior / Siguiente".
 */
export interface RespuestaPaginada<T> {
  datos: T[];
  pagina: number;
  porPagina: number;
  total: number;
  totalPaginas: number;
}

// ============================================================
// PANEL Y REPORTES
// ============================================================

/** Indicadores (KPIs) de las tarjetas del Dashboard. */
export interface KpisPanel {
  totalProductos: number;
  blistersEnStock: number;
  productosStockBajo: number;
  productosStockCritico: number;
  lotesPorVencer: number;
  lotesVencidos: number;
  alertasActivas: number;
  ventasHoySoles: number;
  mermaAcumuladaSoles: number;
}

/** Respuesta del endpoint GET /api/panel/resumen. */
export interface ResumenPanel {
  kpis: KpisPanel;
  /** Productos en estado AMARILLO o ROJO, ordenados por severidad. */
  productosAtencion: ProductoConStock[];
}

/** KPIs del reporte de entradas y salidas diarias. */
export interface KpisReporteDiario {
  /** Entradas del periodo, en cajas y en blísters. */
  cajasIngresadas: number;
  blistersIngresados: number;
  valorEntradasSoles: number;
  /** Salidas del periodo (ventas + mermas), en blísters. */
  blistersRetirados: number;
  blistersVendidos: number;
  blistersMerma: number;
  valorVentasSoles: number;
  valorMermaSoles: number;
  /** Número de comprobantes emitidos en el periodo. */
  cantidadVentas: number;
}

/** Respuesta del endpoint GET /api/reportes/diario. */
export interface ReporteDiario {
  desde: string;
  hasta: string;
  kpis: KpisReporteDiario;
  movimientos: RespuestaPaginada<MovimientoDetallado>;
}

// ============================================================
// OPERACIONES DE INVENTARIO Y VENTA
// ============================================================

/** Detalle de un lote consumido durante un despacho FEFO. */
export interface DetalleDespacho {
  loteId: string;
  numeroLote: string;
  fechaVencimiento: string;
  /** Blísters tomados de este lote. */
  blistersTomados: number;
  /** Cajas cerradas consumidas de este lote. */
  cajasConsumidas: number;
  /**
   * Cuántas cajas hubo que ABRIR en este lote para completar el pedido.
   * Es la prueba visible de la regla de negocio de venta por blíster.
   */
  cajasAbiertas: number;
}

/** Una línea del carrito que envía el POS al backend. */
export interface LineaVenta {
  productoId: string;
  modalidad: UnidadEmpaque;
  cantidad: number;
}

/** Respuesta del endpoint POST /api/ventas (venta completada). */
export interface ResultadoVenta {
  ventaId: string;
  numeroComprobante: string;
  totalSoles: number;
  fecha: string;
  lineas: {
    productoId: string;
    productoNombre: string;
    modalidad: UnidadEmpaque;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    /** Lotes de los que salió la mercadería, según FEFO. */
    despacho: DetalleDespacho[];
  }[];
}

/** Resumen que devuelve el motor de alertas tras recalcular. */
export interface ResumenGeneracionAlertas {
  creadas: number;
  actualizadas: number;
  resueltas: number;
  vigentes: number;
}
