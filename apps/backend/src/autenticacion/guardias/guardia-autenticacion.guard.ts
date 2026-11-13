import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PerfilUsuario } from '@botica/comun';
import { SupabaseService } from '../../supabase/supabase.service';
import { CLAVE_ES_PUBLICO } from '../decoradores/publico.decorator';

/**
 * Caché breve token -> perfil validado (compartida por todo el backend).
 * Un cambio de rol o una desactivación hecha por el ADMIN la limpia al
 * instante con olvidarSesionesDe(); si no, caduca sola a los 30 s.
 */
const TTL_CACHE_MS = 30_000;
const cacheSesiones = new Map<string, { perfil: PerfilUsuario; expira: number }>();

/** Descarta las sesiones en caché de un usuario (tras editarlo o desactivarlo). */
export function olvidarSesionesDe(usuarioId: string): void {
  for (const [token, valor] of cacheSesiones) {
    if (valor.perfil.id === usuarioId) cacheSesiones.delete(token);
  }
}

/**
 * Guardia global de autenticación (se ejecuta en TODAS las peticiones).
 *
 * Flujo:
 *   1. Si el endpoint está marcado @Publico() -> pasa sin validar.
 *   2. Extrae el token "Bearer <jwt>" del encabezado Authorization.
 *      Ese JWT lo emitió Supabase Auth cuando el usuario inició sesión.
 *   3. Valida el token contra Supabase (auth.getUser).
 *   4. Carga el perfil de negocio desde la tabla `usuarios` (rol + botica).
 *   5. Adjunta el perfil a la petición -> los controladores lo reciben
 *      mediante el decorador @UsuarioActual().
 */
@Injectable()
export class GuardiaAutenticacion implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    // 1) ¿Endpoint público?
    const esPublico = this.reflector.getAllAndOverride<boolean>(CLAVE_ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) return true;

    // 2) Extraer el token del encabezado
    const peticion = contexto.switchToHttp().getRequest();
    const encabezado: string | undefined = peticion.headers?.authorization;
    if (!encabezado?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No se proporcionó el token de acceso');
    }
    const token = encabezado.slice('Bearer '.length);

    // Caché breve: una misma pantalla dispara varias peticiones seguidas con
    // el mismo token; validarlo cada vez contra Supabase sumaba ~1 s a cada una.
    const enCache = cacheSesiones.get(token);
    if (enCache && enCache.expira > Date.now()) {
      peticion.usuario = enCache.perfil;
      return true;
    }

    // 3) Validar el JWT contra Supabase Auth
    const { data, error } = await this.supabase.cliente.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Token inválido o sesión expirada');
    }

    // 4) Cargar el perfil de negocio (usuario + botica a la que pertenece)
    const { data: perfil } = await this.supabase.cliente
      .from('usuarios')
      .select('*, botica:boticas(*)')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!perfil) {
      throw new UnauthorizedException(
        'Su cuenta existe pero no está vinculada a ninguna botica. ' +
          'Ejecute el bloque final de supabase/semilla.sql para registrar su perfil.',
      );
    }
    if (!perfil.activo) {
      throw new UnauthorizedException('Su usuario fue desactivado. Contacte al administrador.');
    }

    // 5) Adjuntar el perfil a la petición para el resto de la cadena
    peticion.usuario = perfil as PerfilUsuario;
    this.guardarEnCache(token, perfil as PerfilUsuario);
    return true;
  }

  private guardarEnCache(token: string, perfil: PerfilUsuario) {
    const ahora = Date.now();
    // Limpieza simple para que el mapa no crezca sin límite
    if (cacheSesiones.size > 500) {
      for (const [clave, valor] of cacheSesiones) if (valor.expira <= ahora) cacheSesiones.delete(clave);
    }
    cacheSesiones.set(token, { perfil, expira: ahora + TTL_CACHE_MS });
  }
}
