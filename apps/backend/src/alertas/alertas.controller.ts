import { Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { EstadoAlerta, PerfilUsuario, TipoAlerta } from '@botica/comun';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { AlertasService } from './alertas.service';

/**
 * Endpoints de alertas.
 *
 * Las alertas son 100 % automáticas: nadie las "resuelve" a mano. Se crean
 * cuando aparece la condición (stock bajo, lote por vencer o vencido) y se
 * resuelven solas cuando la condición desaparece (llega mercadería, se vende
 * o se registra la merma). Por eso no existen acciones manuales por alerta.
 */
@Controller('alertas')
export class AlertasController {
  constructor(private readonly servicio: AlertasService) {}

  /**
   * GET /api/alertas?estado=ACTIVA&tipo=VENCIDO&recalcular=true
   * Con `recalcular=true` primero reconcilia el motor de alertas con el
   * inventario actual, de modo que la pantalla siempre muestra datos al día.
   */
  @Get()
  async listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query('estado') estado?: EstadoAlerta,
    @Query('tipo') tipo?: TipoAlerta,
    @Query('recalcular') recalcular?: string,
  ) {
    if (recalcular === 'true') await this.servicio.generarAlertas(usuario.botica_id!);
    return this.servicio.listar(usuario.botica_id!, {
      estado: estado || undefined,
      tipo: tipo || undefined,
    });
  }

  /**
   * GET /api/alertas/contador → números para la campanita del header.
   * Recalcula antes de contar para que el número refleje el inventario actual.
   */
  @Get('contador')
  async contador(@UsuarioActual() usuario: PerfilUsuario) {
    await this.servicio.generarAlertas(usuario.botica_id!).catch(() => undefined);
    return this.servicio.contarActivas(usuario.botica_id!);
  }

  /** POST /api/alertas/generar → fuerza el recálculo inmediato. */
  @Post('generar')
  generar(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.generarAlertas(usuario.botica_id!);
  }

  /**
   * PATCH /api/alertas/vistas → al abrir la pantalla de alertas, las activas
   * quedan como vistas (deja de mostrarse la etiqueta "Nueva").
   */
  @Patch('vistas')
  marcarVistas(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.marcarTodasLeidas(usuario.botica_id!);
  }
}
