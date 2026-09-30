import { Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { EstadoAlerta, PerfilUsuario, TipoAlerta } from '@botica/comun';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { AlertasService } from './alertas.service';

@Controller('alertas')
export class AlertasController {
  constructor(private readonly servicio: AlertasService) {}

  /** GET /api/alertas?estado=ACTIVA&tipo=VENCIDO → listado con filtros. */
  @Get()
  listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query('estado') estado?: EstadoAlerta,
    @Query('tipo') tipo?: TipoAlerta,
  ) {
    return this.servicio.listar(usuario.botica_id!, {
      estado: estado || undefined,
      tipo: tipo || undefined,
    });
  }

  /** GET /api/alertas/contador → números para la campanita del header. */
  @Get('contador')
  contador(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.contarActivas(usuario.botica_id!);
  }

  /** POST /api/alertas/generar → fuerza el recálculo inmediato. */
  @Post('generar')
  generar(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.generarAlertas(usuario.botica_id!);
  }

  /** PATCH /api/alertas/:id/leida → marcar como leída. */
  @Patch(':id/leida')
  marcarLeida(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.marcarLeida(usuario.botica_id!, id);
  }

  /** PATCH /api/alertas/:id/resolver → resolver manualmente. */
  @Patch(':id/resolver')
  resolver(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.resolver(usuario.botica_id!, id);
  }
}
