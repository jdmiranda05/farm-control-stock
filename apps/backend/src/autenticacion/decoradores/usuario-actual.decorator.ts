import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PerfilUsuario } from '@botica/comun';

/**
 * Inyecta en el controlador el perfil del usuario autenticado
 * (lo dejó adjunto GuardiaAutenticacion en la petición).
 *
 * Ejemplo:
 *   @Get()
 *   listar(@UsuarioActual() usuario: PerfilUsuario) {
 *     return this.servicio.listar(usuario.botica_id);
 *   }
 */
export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): PerfilUsuario => {
    const peticion = contexto.switchToHttp().getRequest();
    return peticion.usuario as PerfilUsuario;
  },
);
