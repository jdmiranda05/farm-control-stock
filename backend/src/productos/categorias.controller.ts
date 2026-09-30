import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { ProductosService } from './productos.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';

/** Endpoints de categorías (viven dentro del módulo de productos). */
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly servicio: ProductosService) {}

  /** GET /api/categorias — categorías de la botica. */
  @Get()
  listar(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.listarCategorias(usuario.botica_id);
  }

  /** POST /api/categorias — crear categoría. */
  @Roles(RolUsuario.ALMACENERO)
  @Post()
  crear(@UsuarioActual() usuario: PerfilUsuario, @Body() dto: CrearCategoriaDto) {
    return this.servicio.crearCategoria(usuario.botica_id, dto);
  }

  /**
   * DELETE /api/categorias/:id — eliminar categoría.
   * Solo el ADMIN: los productos que la usaban quedan "sin categoría".
   */
  @Roles(RolUsuario.ADMIN)
  @Delete(':id')
  eliminar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.eliminarCategoria(usuario.botica_id, id);
  }
}
