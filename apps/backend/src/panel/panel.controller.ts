import { Controller, Get } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { PanelService } from './panel.service';

@Controller('panel')
export class PanelController {
  constructor(private readonly servicio: PanelService) {}

  /** GET /api/panel/resumen → KPIs + productos que requieren atención. */
  @Roles(RolUsuario.ALMACENERO, RolUsuario.ADMIN)
  @Get('resumen')
  resumen(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.obtenerResumen(usuario.botica_id!);
  }
}
