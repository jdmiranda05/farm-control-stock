import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Proveedor } from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';

/**
 * Lógica de negocio de Proveedores (laboratorios y distribuidoras).
 * Cada lote de mercadería queda relacionado con el proveedor que lo entregó,
 * lo que permite rastrear el origen de un medicamento vencido o dañado.
 */
@Injectable()
export class ProveedoresService {
  constructor(private readonly supabase: SupabaseService) {}

  async listar(boticaId: string, incluirInactivos = false): Promise<Proveedor[]> {
    let consulta = this.supabase.cliente
      .from('proveedores')
      .select('*')
      .eq('botica_id', boticaId)
      .order('nombre');

    if (!incluirInactivos) consulta = consulta.eq('activo', true);

    const { data, error } = await consulta;
    this.supabase.verificarError(error, 'listar proveedores');
    return (data ?? []) as Proveedor[];
  }

  /** Busca un proveedor validando que pertenezca a la botica (multi-tenant). */
  async obtenerPorId(boticaId: string, proveedorId: string): Promise<Proveedor> {
    const { data, error } = await this.supabase.cliente
      .from('proveedores')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('id', proveedorId)
      .maybeSingle();
    this.supabase.verificarError(error, 'buscar el proveedor');
    if (!data) throw new NotFoundException('Proveedor no encontrado en esta botica');
    return data as Proveedor;
  }

  async crear(boticaId: string, dto: CrearProveedorDto): Promise<Proveedor> {
    const { data, error } = await this.supabase.cliente
      .from('proveedores')
      .insert({
        botica_id: boticaId,
        nombre: dto.nombre,
        ruc: dto.ruc ?? null,
        telefono: dto.telefono ?? null,
        contacto: dto.contacto ?? null,
      })
      .select()
      .single();

    // 23505 = violación de restricción única (nombre repetido en la botica)
    if (error?.code === '23505') {
      throw new BadRequestException(`Ya existe un proveedor llamado "${dto.nombre}"`);
    }
    this.supabase.verificarError(error, 'crear el proveedor');
    return data as Proveedor;
  }

  async actualizar(
    boticaId: string,
    proveedorId: string,
    dto: ActualizarProveedorDto,
  ): Promise<Proveedor> {
    await this.obtenerPorId(boticaId, proveedorId); // valida pertenencia al tenant

    const cambios: Record<string, unknown> = {};
    if (dto.nombre !== undefined) cambios.nombre = dto.nombre;
    if (dto.ruc !== undefined) cambios.ruc = dto.ruc;
    if (dto.telefono !== undefined) cambios.telefono = dto.telefono;
    if (dto.contacto !== undefined) cambios.contacto = dto.contacto;
    if (Object.keys(cambios).length === 0) {
      throw new BadRequestException('No se envió ningún campo para actualizar');
    }

    const { data, error } = await this.supabase.cliente
      .from('proveedores')
      .update(cambios)
      .eq('botica_id', boticaId)
      .eq('id', proveedorId)
      .select()
      .single();
    this.supabase.verificarError(error, 'actualizar el proveedor');
    return data as Proveedor;
  }

  /**
   * Baja lógica del proveedor: se conserva la fila para que los lotes
   * históricos no pierdan la referencia de quién entregó la mercadería.
   */
  async desactivar(boticaId: string, proveedorId: string): Promise<{ mensaje: string }> {
    await this.obtenerPorId(boticaId, proveedorId);
    const { error } = await this.supabase.cliente
      .from('proveedores')
      .update({ activo: false })
      .eq('botica_id', boticaId)
      .eq('id', proveedorId);
    this.supabase.verificarError(error, 'desactivar el proveedor');
    return { mensaje: 'Proveedor desactivado correctamente' };
  }
}
