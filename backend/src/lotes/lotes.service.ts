import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateLoteEntradaDto } from './dto/create-lote-entrada.dto.js';

@Injectable()
export class LotesService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly client: SupabaseClient,
  ) {}

  async findAll() {
    const { data, error } = await this.client
      .from('v_lotes_inventario')
      .select('*')
      .order('fecha_vencimiento', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async registrarEntrada(dto: CreateLoteEntradaDto) {
    const { data: lote, error: loteError } = await this.client
      .from('lotes')
      .insert({
        producto_id: dto.producto_id,
        proveedor_id: dto.proveedor_id ?? null,
        codigo_lote: dto.codigo_lote,
        cantidad: dto.cantidad,
        fecha_vencimiento: dto.fecha_vencimiento,
        precio_compra: dto.precio_compra,
      })
      .select()
      .single();

    if (loteError) throw loteError;

    const { error: movimientoError } = await this.client
      .from('movimientos_kardex')
      .insert({
        producto_id: dto.producto_id,
        lote_id: lote.id,
        tipo: 'entrada',
        cantidad: dto.cantidad,
        motivo: 'Registro de entrada',
        costo_unitario: dto.precio_compra,
      });

    if (movimientoError) throw movimientoError;
    return lote;
  }
}
