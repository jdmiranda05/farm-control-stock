import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Categoria, Producto, ProductoConStock } from '@botica/comun';
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

  async crear(boticaId: string, dto: CrearProductoDto): Promise<Producto> {
    // Traducción camelCase (API) -> snake_case (tabla `productos`)
    const registro = {
      botica_id: boticaId,
      codigo: dto.codigo ?? null,
      nombre: dto.nombre,
      categoria_id: dto.categoriaId ?? null,
      presentacion: dto.presentacion ?? null,
      laboratorio: dto.laboratorio ?? null,
      unidades_por_caja: dto.unidadesPorCaja,
      precio_caja: dto.precioCaja,
      precio_blister: dto.precioBlister,
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
    await this.obtenerPorId(boticaId, productoId); // valida pertenencia al tenant

    const cambios: Record<string, unknown> = {};
    if (dto.codigo !== undefined) cambios.codigo = dto.codigo;
    if (dto.nombre !== undefined) cambios.nombre = dto.nombre;
    if (dto.categoriaId !== undefined) cambios.categoria_id = dto.categoriaId;
    if (dto.presentacion !== undefined) cambios.presentacion = dto.presentacion;
    if (dto.laboratorio !== undefined) cambios.laboratorio = dto.laboratorio;
    if (dto.unidadesPorCaja !== undefined) cambios.unidades_por_caja = dto.unidadesPorCaja;
    if (dto.precioCaja !== undefined) cambios.precio_caja = dto.precioCaja;
    if (dto.precioBlister !== undefined) cambios.precio_blister = dto.precioBlister;
    if (dto.stockMinimo !== undefined) cambios.stock_minimo = dto.stockMinimo;
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
    this.supabase.verificarError(error, 'actualizar el producto');
    return data as Producto;
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

  async listarCategorias(boticaId: string): Promise<Categoria[]> {
    const { data, error } = await this.supabase.cliente
      .from('categorias')
      .select('*')
      .eq('botica_id', boticaId)
      .order('nombre');
    this.supabase.verificarError(error, 'listar categorías');
    return (data ?? []) as Categoria[];
  }

  async crearCategoria(boticaId: string, dto: CrearCategoriaDto): Promise<Categoria> {
    const { data, error } = await this.supabase.cliente
      .from('categorias')
      .insert({
        botica_id: boticaId,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
      })
      .select()
      .single();

    if (error?.code === '23505') {
      throw new BadRequestException(`Ya existe la categoría "${dto.nombre}" en esta botica`);
    }
    this.supabase.verificarError(error, 'crear la categoría');
    return data as Categoria;
  }

  /**
   * ELIMINAR una categoría. Operación reservada al rol ADMIN.
   * No se borran los productos que la usaban: por la regla
   * `on delete set null` del esquema, simplemente quedan "sin categoría".
   * Se avisa cuántos productos quedarán así para que la decisión sea informada.
   */
  async eliminarCategoria(
    boticaId: string,
    categoriaId: string,
  ): Promise<{ mensaje: string; productosAfectados: number }> {
    const { data: categoria } = await this.supabase.cliente
      .from('categorias')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('id', categoriaId)
      .maybeSingle();
    if (!categoria) throw new NotFoundException('Categoría no encontrada en esta botica');

    // ¿Cuántos productos quedarán sin categoría?
    const { count } = await this.supabase.cliente
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('botica_id', boticaId)
      .eq('categoria_id', categoriaId);

    const { error } = await this.supabase.cliente
      .from('categorias')
      .delete()
      .eq('botica_id', boticaId)
      .eq('id', categoriaId);
    this.supabase.verificarError(error, 'eliminar la categoría');

    const productosAfectados = count ?? 0;
    return {
      mensaje:
        `Categoría "${categoria.nombre}" eliminada.` +
        (productosAfectados > 0
          ? ` ${productosAfectados} producto(s) quedaron sin categoría.`
          : ''),
      productosAfectados,
    };
  }
}
