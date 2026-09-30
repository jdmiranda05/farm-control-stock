import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Servicio de acceso a Supabase (PostgreSQL + Auth).
 *
 * Usa la clave `service_role`, que tiene privilegios administrativos y
 * omite las políticas RLS. Por eso:
 *   ⚠️  Esta clave vive SOLO en el backend (.env) — jamás en el frontend.
 *   ⚠️  Cada consulta de los servicios de negocio filtra por `botica_id`
 *       (aislamiento multi-tenant aplicado en la capa de aplicación).
 */
@Injectable()
export class SupabaseService {
  /** Cliente único reutilizado por todos los módulos. */
  readonly cliente: SupabaseClient;

  constructor(configuracion: ConfigService) {
    const url = configuracion.get<string>('SUPABASE_URL');
    const claveServicio = configuracion.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !claveServicio) {
      throw new Error(
        'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env ' +
          '(copie backend/.env.ejemplo como backend/.env)',
      );
    }

    this.cliente = createClient(url, claveServicio, {
      auth: {
        // El backend no mantiene sesiones propias: valida tokens por petición.
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Ayudante para propagar errores de PostgREST como HTTP 500 legibles.
   * Uso: this.supabase.verificarError(error, 'listar productos');
   */
  verificarError(error: { message: string } | null, contexto: string): void {
    if (error) {
      throw new InternalServerErrorException(
        `Error de base de datos al ${contexto}: ${error.message}`,
      );
    }
  }
}
