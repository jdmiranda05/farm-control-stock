import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Categoria } from './entities/categoria.entity.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

@Injectable()
export class CategoriasService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly client: SupabaseClient,
  ) {}

  async findAll(): Promise<Categoria[]> {
    const { data, error } = await this.client
      .from('categorias')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async findOne(id: number): Promise<Categoria> {
    const { data, error } = await this.client
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Categoría no encontrada');
    return data;
  }

  async create(dto: CreateCategoriaDto): Promise<Categoria> {
    const { data, error } = await this.client
      .from('categorias')
      .insert({
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        activo: dto.activo ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: number, dto: UpdateCategoriaDto): Promise<Categoria> {
    const updateData: Record<string, unknown> = {};
    if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion ?? null;
    if (dto.activo !== undefined) updateData.activo = dto.activo;

    const { data, error } = await this.client
      .from('categorias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Categoría no encontrada');
    return data;
  }

  async remove(id: number): Promise<void> {
    const { error } = await this.client
      .from('categorias')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
  }
}
