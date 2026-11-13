import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { VentasService } from './ventas.service';
import { RegistrarVentaDto } from './dto/registrar-venta.dto';
import { PaginacionDto } from '../comun/dto/paginacion.dto';

/**
 * Endpoints del punto de venta.
 * Registrar ventas es exclusivo del VENDEDOR: el ADMIN solo cumple
 * funciones administrativas y el ALMACENERO trabaja en el almacén.
 */
@Controller('ventas')
export class VentasController {
  constructor(private readonly servicio: VentasService) {}

  /**
   * POST /api/ventas — completar una venta.
   * Descuenta el stock automáticamente con FEFO y registra el kardex.
   */
  @Roles(RolUsuario.VENDEDOR)
  @Post()
  registrar(@UsuarioActual() usuario: PerfilUsuario, @Body() dto: RegistrarVentaDto) {
    return this.servicio.registrar(usuario.botica_id, usuario.id, dto);
  }

  /** GET /api/ventas?pagina=&porPagina= — historial de comprobantes. */
  @Get()
  listar(@UsuarioActual() usuario: PerfilUsuario, @Query() paginacion: PaginacionDto) {
    return this.servicio.listar(usuario.botica_id, paginacion);
  }
}
