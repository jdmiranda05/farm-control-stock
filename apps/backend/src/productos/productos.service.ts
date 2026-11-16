import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Categoria,
  Producto,
  ProductoConStock,
  RespuestaPaginada,
  validarEmpaque,
} from '@botica/comun';
import { armarRespuestaPaginada, calcularRango } from '../comun/dto/paginacion.dto';
import { FiltroProductosDto, MAXIMO_PRODUCTOS_POR_PAGINA } from './dto/filtro-productos.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';

/**
 * Lógica de negocio de Productos y Categorías.
 * REGLA MULTI-TENANT: toda consulta filtra por `botica_id`, que proviene
 * del usuario autenticado (nunca de un parámetro que envíe el cliente).
 */
@Injectable()
export class ProductosService {
  constructor(private readonly supabase: SupabaseService) {}

  // ============================================================
  // PRODUCTOS
  // ============================================================

  /**
   * Lista el catálogo con stock consolidado y los dos semáforos,
   * leyendo la vista `vista_stock_productos` (el cálculo lo hace PostgreSQL).
   */
  async listar(boticaId: string, incluirInactivos = false): Promise<ProductoConStock[]> {
    let consulta = this.supabase.cliente
      .from('vista_stock_productos')
      .select('*')
      .eq('botica_id', boticaId)
      .order('nombre');

    if (!incluirInactivos) consulta = consulta.eq('activo', true);

    const { data, error } = await consulta;
    this.supabase.verificarError(error, 'listar productos');
    return (data ?? []) as ProductoConStock[];
  }

  /**
   * Catálogo PAGINADO en el servidor (máximo 30 por página) para la pantalla
   * "Productos y Categorías". La búsqueda y el filtro por categoría también
   * los resuelve PostgreSQL, así funcionan sobre todo el catálogo y no solo
   * sobre la página visible.
   */
  async listarPaginado(
    boticaId: string,
    filtros: FiltroProductosDto,
  ): Promise<RespuestaPaginada<ProductoConStock>> {
    const { pagina, porPagina, desde, hasta } = calcularRango({
      pagina: filtros.pagina,
      porPagina: Math.min(filtros.porPagina ?? MAXIMO_PRODUCTOS_POR_PAGINA, MAXIMO_PRODUCTOS_POR_PAGINA),
    });

    let consulta = this.supabase.cliente
      .from('vista_stock_productos')
      .select('*', { count: 'exact' })
      .eq('botica_id', boticaId)
      .eq('activo', true);

    if (filtros.categoriaId) consulta = consulta.eq('categoria_id', filtros.categoriaId);

    // Se quitan los caracteres que tienen significado en el filtro `or` de PostgREST
    const texto = (filtros.busqueda ?? '').replace(/[,()%*\\]/g, ' ').trim();
    if (texto) {
      const patron = `%${texto}%`;
      consulta = consulta.or(
        `nombre.ilike.${patron},codigo.ilike.${patron},laboratorio.ilike.${patron},categoria_nombre.ilike.${patron}`,
      );
    }

    const { data, error, count } = await consulta
      .order('nombre', { ascending: true })
      .order('id', { ascending: true }) // orden estable entre páginas
      .range(desde, hasta);
    this.supabase.verificarError(error, 'listar el catálogo');
    return armarRespuestaPaginada((data ?? []) as ProductoConStock[], count ?? 0, pagina, porPagina);
  }

  /** Productos desactivados: alimenta el panel de reactivación del ADMIN. */
  async listarInactivos(boticaId: string): Promise<ProductoConStock[]> {
    const { data, error } = await this.supabase.cliente
      .from('vista_stock_productos')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('activo', false)
      .order('nombre');
    this.supabase.verificarError(error, 'listar productos desactivados');
    return (data ?? []) as ProductoConStock[];
  }

  /** Obtiene un producto verificando que pertenezca a la botica. */
  async obtenerPorId(boticaId: string, productoId: string): Promise<Producto> {
    const { data, error } = await this.supabase.cliente
      .from('productos')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('id', productoId)
      .maybeSingle();
    this.supabase.verificarError(error, 'buscar el producto');
    if (!data) throw new NotFoundException('Producto no encontrado en esta botica');
    return data as Producto;
  }

  /**
   * Normaliza y valida el empaque (caja / blíster) con las reglas compartidas
   * de @botica/comun. Un producto SIN blísters se guarda con 1 unidad por
   * caja y con el precio por blíster igual al de la unidad.
   */
  private normalizarEmpaque(datos: {
    tieneBlisters?: boolean;
    unidadesPorCaja: number;
    precioCaja: number;
    precioBlister?: number;
  }) {
    const conBlisters = datos.tieneBlisters ?? datos.unidadesPorCaja > 1;
    const empaque = {
      tieneBlisters: conBlisters,
      unidadesPorCaja: conBlisters ? datos.unidadesPorCaja : 1,
      precioCaja: Number(datos.precioCaja),
      precioBlister: conBlisters ? Number(datos.precioBlister ?? 0) : Number(datos.precioCaja),
    };
    const errores = validarEmpaque(empaque);
    if (errores.length > 0) throw new BadRequestException(errores);
    return empaque;
  }

  /** Limpia textos opcionales: "  " -> null. */
  private texto(valor: string | undefined | null): string | null {
    const limpio = valor?.trim();
    return limpio ? limpio : null;
  }

  async crear(boticaId: string, dto: CrearProductoDto): Promise<Producto> {
    const nombre = dto.nombre.trim();
    if (!nombre) throw new BadRequestException('El nombre del producto es obligatorio');
    const empaque = this.normalizarEmpaque(dto);

    // Traducción camelCase (API) -> snake_case (tabla `productos`)
    const registro = {
      botica_id: boticaId,
      codigo: this.texto(dto.codigo),
      nombre,
      categoria_id: dto.categoriaId ?? null,
      presentacion: this.texto(dto.presentacion),
      laboratorio: this.texto(dto.laboratorio),
      ...(dto.imagenUrl ? { imagen_url: dto.imagenUrl } : {}),
      unidades_por_caja: empaque.unidadesPorCaja,
      precio_caja: empaque.precioCaja,
      precio_blister: empaque.precioBlister,
      stock_minimo: dto.stockMinimo,
      requiere_receta: dto.requiereReceta ?? false,
    };

    const { data, error } = await this.supabase.cliente
      .from('productos')
      .insert(registro)
      .select()
      .single();

    // 23505 = violación de restricción única (código repetido en la botica)
    if (error?.code === '23505') {
      throw new BadRequestException(`Ya existe un producto con el código "${dto.codigo}"`);
    }
    this.supabase.verificarError(error, 'crear el producto');
    return data as Producto;
  }

  async actualizar(
    boticaId: string,
    productoId: string,
    dto: ActualizarProductoDto,
  ): Promise<Producto> {
    const actual = await this.obtenerPorId(boticaId, productoId); // valida pertenencia al tenant

    const cambios: Record<string, unknown> = {};
    if (dto.codigo !== undefined) cambios.codigo = this.texto(dto.codigo);
    if (dto.nombre !== undefined) {
      const nombre = dto.nombre.trim();
      if (!nombre) throw new BadRequestException('El nombre del producto es obligatorio');
      cambios.nombre = nombre;
    }
    if (dto.categoriaId !== undefined) cambios.categoria_id = dto.categoriaId || null;
    if (dto.presentacion !== undefined) cambios.presentacion = this.texto(dto.presentacion);
    if (dto.imagenUrl !== undefined && (dto.imagenUrl !== null || actual.imagen_url != null)) {
      cambios.imagen_url = dto.imagenUrl;
    }
    if (dto.laboratorio !== undefined) cambios.laboratorio = this.texto(dto.laboratorio);
    if (dto.stockMinimo !== undefined) cambios.stock_minimo = dto.stockMinimo;

    // Empaque: se valida combinando lo enviado con lo que ya está guardado.
    const tocaEmpaque =
      dto.tieneBlisters !== undefined ||
      dto.unidadesPorCaja !== undefined ||
      dto.precioCaja !== undefined ||
      dto.precioBlister !== undefined;
    if (tocaEmpaque) {
      const empaque = this.normalizarEmpaque({
        tieneBlisters: dto.tieneBlisters ?? (dto.unidadesPorCaja ?? actual.unidades_por_caja) > 1,
        unidadesPorCaja: dto.unidadesPorCaja ?? actual.unidades_por_caja,
        precioCaja: dto.precioCaja ?? Number(actual.precio_caja),
        precioBlister: dto.precioBlister ?? Number(actual.precio_blister),
      });

      // Cambiar el número de blísters por caja con mercadería en almacén
      // alteraría el stock ya registrado (cajas * unidades + sueltos).
      if (empaque.unidadesPorCaja !== actual.unidades_por_caja) {
        await this.verificarSinExistencias(boticaId, productoId, actual.nombre);
      }
      cambios.unidades_por_caja = empaque.unidadesPorCaja;
      cambios.precio_caja = empaque.precioCaja;
      cambios.precio_blister = empaque.precioBlister;
    }
    if (dto.requiereReceta !== undefined) cambios.requiere_receta = dto.requiereReceta;
    if (Object.keys(cambios).length === 0) {
      throw new BadRequestException('No se envió ningún campo para actualizar');
    }

    const { data, error } = await this.supabase.cliente
      .from('productos')
      .update(cambios)
      .eq('botica_id', boticaId)
      .eq('id', productoId)
      .select()
      .single();
    if (error?.code === '23505') {
      throw new BadRequestException(`Ya existe un producto con el código "${dto.codigo}"`);
    }
    this.supabase.verificarError(error, 'actualizar el producto');
    return data as Producto;
  }

  /** Impide cambiar el empaque si el producto todavía tiene stock en lotes. */
  private async verificarSinExistencias(boticaId: string, productoId: string, nombre: string) {
    const { data: lotes, error } = await this.supabase.cliente
      .from('lotes')
      .select('cajas_completas, blisters_sueltos')
      .eq('botica_id', boticaId)
      .eq('producto_id', productoId);
    this.supabase.verificarError(error, 'verificar el stock del producto');

    const conStock = (lotes ?? []).some(
      (lote) => lote.cajas_completas > 0 || lote.blisters_sueltos > 0,
    );
    if (conStock) {
      throw new BadRequestException(
        `No se puede cambiar el empaque (blísters por caja) de "${nombre}" porque ` +
          'todavía tiene mercadería en almacén. Agote o dé de baja su stock primero.',
      );
    }
  }

  /**
   * Baja LÓGICA: se marca inactivo en lugar de borrar, para conservar
   * el kardex y la trazabilidad de los lotes ya recibidos.
   */
  async desactivar(boticaId: string, productoId: string): Promise<{ mensaje: string }> {
    const producto = await this.obtenerPorId(boticaId, productoId);
    const { error } = await this.supabase.cliente
      .from('productos')
      .update({ activo: false })
      .eq('botica_id', boticaId)
      .eq('id', productoId);
    this.supabase.verificarError(error, 'desactivar el producto');
    return { mensaje: `Producto "${producto.nombre}" desactivado correctamente` };
  }

  /**
   * REACTIVAR un producto dado de baja. Operación reservada al rol ADMIN
   * (se ejecuta desde la pantalla del Kardex) porque devuelve al catálogo
   * y al punto de venta un artículo que alguien retiró deliberadamente.
   */
  async reactivar(boticaId: string, productoId: string): Promise<{ mensaje: string }> {
    const producto = await this.obtenerPorId(boticaId, productoId);
    if (producto.activo) {
      throw new BadRequestException(`El producto "${producto.nombre}" ya se encuentra activo`);
    }

    const { error } = await this.supabase.cliente
      .from('productos')
      .update({ activo: true })
      .eq('botica_id', boticaId)
      .eq('id', productoId);
    this.supabase.verificarError(error, 'reactivar el producto');
    return { mensaje: `Producto "${producto.nombre}" reactivado correctamente` };
  }

  // ============================================================
  // CATEGORÍAS
  // ============================================================

  /**
   * Categorías de la botica. Por defecto solo las activas; con
   * `incluirInactivas` también las deshabilitadas (panel del ADMIN).
   */
  async listarCategorias(boticaId: string, incluirInactivas = false): Promise<Categoria[]> {
    const { data, error } = await this.supabase.cliente
      .from('categorias')
      .select('*')
      .eq('botica_id', boticaId)
      .order('nombre');
    this.supabase.verificarError(error, 'listar categorías');
    const categorias = ((data ?? []) as Categoria[]).map((c) => ({
      ...c,
      activa: c.activa ?? true, // sin migración aplicada, todas cuentan como activas
    }));
    return incluirInactivas ? categorias : categorias.filter((c) => c.activa);
  }

  async crearCategoria(boticaId: string, dto: CrearCategoriaDto): Promise<Categoria> {
    const { data, error } = await this.supabase.cliente
      .from('categorias')
      .insert({
        botica_id: boticaId,
        nombre: dto.nombre.trim(),
        descripcion: this.texto(dto.descripcion),
      })
      .select()
      .single();

    if (error?.code === '23505') {
      const { data: existente } = await this.supabase.cliente
        .from('categorias')
        .select('*')
        .eq('botica_id', boticaId)
        .eq('nombre', dto.nombre.trim())
        .maybeSingle();
      throw new BadRequestException(
        existente?.activa === false
          ? `La categoría "${dto.nombre.trim()}" existe pero está deshabilitada: ` +
              'un administrador puede reactivarla.'
          : `Ya existe la categoría "${dto.nombre.trim()}" en esta botica`,
      );
    }
    this.supabase.verificarError(error, 'crear la categoría');
    return data as Categoria;
  }

  /** Renombrar una categoría. Operación reservada al rol ADMIN. */
  async actualizarCategoria(
    boticaId: string,
    categoriaId: string,
    dto: CrearCategoriaDto,
  ): Promise<Categoria> {
    const { data, error } = await this.supabase.cliente
      .from('categorias')
      .update({ nombre: dto.nombre.trim(), descripcion: this.texto(dto.descripcion) })
      .eq('botica_id', boticaId)
      .eq('id', categoriaId)
      .select()
      .maybeSingle();

    if (error?.code === '23505') {
      throw new BadRequestException(`Ya existe la categoría "${dto.nombre.trim()}" en esta botica`);
    }
    this.supabase.verificarError(error, 'actualizar la categoría');
    if (!data) throw new NotFoundException('Categoría no encontrada en esta botica');
    return data as Categoria;
  }

  /** Verdadero si el error indica que falta la columna `activa` (migración pendiente). */
  private faltaColumnaActiva(error: { code?: string; message?: string } | null): boolean {
    return (
      !!error &&
      (error.code === '42703' || error.code === 'PGRST204' || /activa/.test(error.message ?? ''))
    );
  }

  private async buscarCategoria(boticaId: string, categoriaId: string): Promise<Categoria> {
    const { data } = await this.supabase.cliente
      .from('categorias')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('id', categoriaId)
      .maybeSingle();
    if (!data) throw new NotFoundException('Categoría no encontrada en esta botica');
    return data as Categoria;
  }

  /** Cambia el estado de la categoría; explica cómo migrar si falta la columna. */
  private async cambiarEstadoCategoria(boticaId: string, categoriaId: string, activa: boolean) {
    const { error } = await this.supabase.cliente
      .from('categorias')
      .update({ activa })
      .eq('botica_id', boticaId)
      .eq('id', categoriaId);
    if (this.faltaColumnaActiva(error)) {
      throw new BadRequestException(
        'Falta aplicar la migración de categorías: ejecute ' +
          'supabase/migracion-categorias-activa.sql en el SQL Editor de Supabase.',
      );
    }
    this.supabase.verificarError(error, 'cambiar el estado de la categoría');
  }

  /**
   * DESHABILITAR una categoría (baja lógica). Operación reservada al ADMIN.
   * Ya no se borra: los productos conservan su categoría y el ADMIN puede
   * reactivarla. Solo deja de ofrecerse al registrar productos nuevos.
   */
  async desactivarCategoria(
    boticaId: string,
    categoriaId: string,
  ): Promise<{ mensaje: string; productosAfectados: number }> {
    const categoria = await this.buscarCategoria(boticaId, categoriaId);
    if (categoria.activa === false) {
      throw new BadRequestException(`La categoría "${categoria.nombre}" ya está deshabilitada`);
    }

    const { count } = await this.supabase.cliente
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('botica_id', boticaId)
      .eq('categoria_id', categoriaId);

    await this.cambiarEstadoCategoria(boticaId, categoriaId, false);

    const productosAfectados = count ?? 0;
    return {
      mensaje:
        `Categoría "${categoria.nombre}" deshabilitada.` +
        (productosAfectados > 0
          ? ` ${productosAfectados === 1 ? "El producto que la usa la conserva" : `Los ${productosAfectados} productos que la usan la conservan`}; puede reactivarla cuando quiera.`
          : ' Puede reactivarla cuando quiera.'),
      productosAfectados,
    };
  }

  /** REACTIVAR una categoría deshabilitada. Operación reservada al ADMIN. */
  async reactivarCategoria(boticaId: string, categoriaId: string): Promise<{ mensaje: string }> {
    const categoria = await this.buscarCategoria(boticaId, categoriaId);
    if (categoria.activa !== false) {
      throw new BadRequestException(`La categoría "${categoria.nombre}" ya está activa`);
    }
    await this.cambiarEstadoCategoria(boticaId, categoriaId, true);
    return { mensaje: `Categoría "${categoria.nombre}" reactivada.` };
  }
}
