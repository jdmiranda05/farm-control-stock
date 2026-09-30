import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Botica } from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';
import { ActualizarBoticaDto } from './dto/actualizar-botica.dto';

@Injectable()
export class BoticasService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Devuelve la botica del usuario autenticado. */
  async obtenerMiBotica(boticaId: string): Promise<Botica> {
    const { data, error } = await this.supabase.cliente
      .from('boticas')
      .select('*')
      .eq('id', boticaId)
      .single();
    this.supabase.verificarError(error, 'obtener la botica');
    if (!data) throw new NotFoundException('Botica no encontrada');
    return data as Botica;
  }

  /** Actualiza la configuración de la botica (nombre, RUC, días de alerta...). */
  async actualizarMiBotica(boticaId: string, dto: ActualizarBoticaDto): Promise<Botica> {
    // Traducción explícita camelCase (API) -> snake_case (base de datos)
    const cambios: Record<string, unknown> = {};
    if (dto.nombre !== undefined) cambios.nombre = dto.nombre;
    if (dto.ruc !== undefined) cambios.ruc = dto.ruc;
    if (dto.direccion !== undefined) cambios.direccion = dto.direccion;
    if (dto.telefono !== undefined) cambios.telefono = dto.telefono;
    if (dto.diasAlertaVencimiento !== undefined) {
      cambios.dias_alerta_vencimiento = dto.diasAlertaVencimiento;
    }
    if (Object.keys(cambios).length === 0) {
      throw new BadRequestException('No se envió ningún campo para actualizar');
    }

    const { data, error } = await this.supabase.cliente
      .from('boticas')
      .update(cambios)
      .eq('id', boticaId)
      .select()
      .single();
    this.supabase.verificarError(error, 'actualizar la botica');
    return data as Botica;
  }
}
