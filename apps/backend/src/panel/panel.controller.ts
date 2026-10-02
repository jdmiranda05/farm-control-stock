import { Controller, Get } from '@nestjs/common';
import { PerfilUsuario } from '@botica/comun';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { PanelService } from './panel.service';

@Controller('panel')
export class PanelController {
  constructor(private readonly servicio: PanelService) {}

  /** GET /api/panel/resumen → KPIs + productos que requieren atención. */
  @Get('resumen')
  resumen(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.obtenerResumen(usuario.botica_id!);
  }
}
