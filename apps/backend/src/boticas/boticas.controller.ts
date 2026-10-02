import { Body, Controller, Get, Patch } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { BoticasService } from './boticas.service';
import { ActualizarBoticaDto } from './dto/actualizar-botica.dto';

@Controller('boticas')
export class BoticasController {
  constructor(private readonly servicio: BoticasService) {}

  /** GET /api/boticas/mia — datos de la botica del usuario autenticado. */
  @Get('mia')
  miBotica(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.obtenerMiBotica(usuario.botica_id);
  }

  /**
   * PATCH /api/boticas/mia — actualizar la configuración.
   * Solo el ADMIN: aquí se define el parámetro de días de alerta que
   * gobierna todo el sistema de vencimientos.
   */
  @Roles(RolUsuario.ADMIN)
  @Patch('mia')
  actualizar(@UsuarioActual() usuario: PerfilUsuario, @Body() dto: ActualizarBoticaDto) {
    return this.servicio.actualizarMiBotica(usuario.botica_id, dto);
  }
}
