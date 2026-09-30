import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { KardexService } from './kardex.service';
import { FiltroKardexDto } from './dto/filtro-kardex.dto';
import { CorregirMovimientoDto } from './dto/corregir-movimiento.dto';

/**
 * Endpoints del Kardex (historial de existencias).
 *
 * Permisos:
 *   - Consultar el historial -> cualquier rol autenticado
 *   - CORREGIR un registro   -> solo ADMIN
 */
@Controller('kardex')
export class KardexController {
  constructor(private readonly servicio: KardexService) {}

  /** GET /api/kardex?tipo=&productoId=&desde=&hasta=&pagina=&porPagina= */
  @Get()
  listar(@UsuarioActual() usuario: PerfilUsuario, @Query() filtros: FiltroKardexDto) {
    return this.servicio.listar(usuario.botica_id, filtros);
  }

  /** GET /api/kardex/producto/:id — historial reciente de un producto. */
  @Get('producto/:id')
  porProducto(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.listarPorProducto(usuario.botica_id, id);
  }

  /**
   * PATCH /api/kardex/:id — corregir un registro del historial.
   * Reservado al ADMIN (corrección de errores administrativos).
   */
  @Roles(RolUsuario.ADMIN)
  @Patch(':id')
  corregir(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CorregirMovimientoDto,
  ) {
    return this.servicio.corregir(usuario.botica_id, id, usuario.id, dto);
  }
}
