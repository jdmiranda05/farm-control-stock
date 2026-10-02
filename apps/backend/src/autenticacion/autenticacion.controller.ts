import { Controller, Get } from '@nestjs/common';
import { PerfilUsuario } from '@botica/comun';
import { UsuarioActual } from './decoradores/usuario-actual.decorator';

/**
 * Endpoints de sesión.
 * El inicio de sesión (correo/contraseña) lo hace el FRONTEND directamente
 * contra Supabase Auth; este controlador solo expone el perfil de negocio
 * asociado al token ya validado.
 */
@Controller('autenticacion')
export class AutenticacionController {
  /** GET /api/autenticacion/perfil → usuario autenticado + su botica. */
  @Get('perfil')
  perfil(@UsuarioActual() usuario: PerfilUsuario): PerfilUsuario {
    return usuario;
  }
}
