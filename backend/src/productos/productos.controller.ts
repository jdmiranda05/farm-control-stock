import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';

/**
 * Endpoints del catálogo de productos.
 *
 * Nótese que `botica_id` NUNCA viaja en la URL ni en el cuerpo: siempre se
 * toma del usuario autenticado (@UsuarioActual), lo que impide que un
 * inquilino consulte o modifique datos de otro.
 *
 * Permisos:
 *   - Consultar    -> cualquier rol (el VENDEDOR necesita ver stock en el POS)
 *   - Crear/editar -> ALMACENERO (y ADMIN, que tiene control total)
 *   - Desactivar   -> ALMACENERO
 *   - REACTIVAR    -> solo ADMIN
 */
@Controller('productos')
export class ProductosController {
  constructor(private readonly servicio: ProductosService) {}

  /** GET /api/productos?incluirInactivos=true — catálogo con stock y semáforos. */
  @Get()
  listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query('incluirInactivos') incluirInactivos?: string,
  ) {
    return this.servicio.listar(usuario.botica_id, incluirInactivos === 'true');
  }

  /** GET /api/productos/inactivos — productos dados de baja (para reactivarlos). */
  @Get('inactivos')
  listarInactivos(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.listarInactivos(usuario.botica_id);
  }

  /** POST /api/productos — crear producto. */
  @Roles(RolUsuario.ALMACENERO)
  @Post()
  crear(@UsuarioActual() usuario: PerfilUsuario, @Body() dto: CrearProductoDto) {
    return this.servicio.crear(usuario.botica_id, dto);
  }

  /** PATCH /api/productos/:id — actualizar datos del producto. */
  @Roles(RolUsuario.ALMACENERO)
  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarProductoDto,
  ) {
    return this.servicio.actualizar(usuario.botica_id, id, dto);
  }

  /**
   * PATCH /api/productos/:id/reactivar — devolver al catálogo un producto
   * desactivado. Solo el ADMIN, desde la pantalla del Kardex.
   */
  @Roles(RolUsuario.ADMIN)
  @Patch(':id/reactivar')
  reactivar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.reactivar(usuario.botica_id, id);
  }

  /** DELETE /api/productos/:id — baja lógica (conserva el historial). */
  @Roles(RolUsuario.ALMACENERO)
  @Delete(':id')
  desactivar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.desactivar(usuario.botica_id, id);
  }
}
