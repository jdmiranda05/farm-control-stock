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
    return true;
  }
}
