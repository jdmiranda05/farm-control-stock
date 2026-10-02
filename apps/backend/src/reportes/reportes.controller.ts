import { Controller, Get, Query } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { ReportesService } from './reportes.service';
import { FiltroReporteDto } from './dto/filtro-reporte.dto';

/**
 * Endpoints de reportes gerenciales.
 * Son información sensible del negocio (costos, márgenes, pérdidas),
 * por eso quedan reservados al ALMACENERO y al ADMIN: el VENDEDOR no
 * necesita ver la valorización del inventario para operar la caja.
 */
@Controller('reportes')
export class ReportesController {
  constructor(private readonly servicio: ReportesService) {}

  /**
   * GET /api/reportes/diario?desde=&hasta=&pagina=&porPagina=
   * Sin fechas devuelve el reporte del día actual.
   */
  @Roles(RolUsuario.ALMACENERO)
  @Get('diario')
  diario(@UsuarioActual() usuario: PerfilUsuario, @Query() filtros: FiltroReporteDto) {
    return this.servicio.reporteDiario(usuario.botica_id, filtros);
  }

  /** GET /api/reportes/merma — pérdidas económicas acumuladas en soles. */
  @Roles(RolUsuario.ALMACENERO)
  @Get('merma')
  merma(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.reporteMerma(usuario.botica_id);
  }
}
