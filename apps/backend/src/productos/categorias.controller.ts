import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { ProductosService } from './productos.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';

/** Endpoints de categorías (viven dentro del módulo de productos). */
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly servicio: ProductosService) {}

  /** GET /api/categorias?incluirInactivas=true — categorías de la botica. */
  @Get()
  listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query('incluirInactivas') incluirInactivas?: string,
  ) {
    return this.servicio.listarCategorias(usuario.botica_id, incluirInactivas === 'true');
  }

  /** POST /api/categorias — crear categoría (solo ADMIN). */
  @Roles(RolUsuario.ADMIN)
  @Post()
  crear(@UsuarioActual() usuario: PerfilUsuario, @Body() dto: CrearCategoriaDto) {
    return this.servicio.crearCategoria(usuario.botica_id, dto);
  }

  /** PATCH /api/categorias/:id — renombrar categoría (solo ADMIN). */
  @Roles(RolUsuario.ADMIN)
  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearCategoriaDto,
  ) {
    return this.servicio.actualizarCategoria(usuario.botica_id, id, dto);
  }

  /**
   * DELETE /api/categorias/:id — DESHABILITAR categoría (baja lógica).
   * Solo el ADMIN. Los productos conservan la categoría y se puede reactivar.
   */
  @Roles(RolUsuario.ADMIN)
  @Delete(':id')
  desactivar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.desactivarCategoria(usuario.botica_id, id);
  }

  /** PATCH /api/categorias/:id/reactivar — devolver una categoría deshabilitada. */
  @Roles(RolUsuario.ADMIN)
  @Patch(':id/reactivar')
  reactivar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.reactivarCategoria(usuario.botica_id, id);
  }
}
