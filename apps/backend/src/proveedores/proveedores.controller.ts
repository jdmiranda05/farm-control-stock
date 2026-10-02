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
import { ProveedoresService } from './proveedores.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';

/**
 * Endpoints de proveedores.
 * Los gestiona el ALMACENERO (y el ADMIN, que tiene control total);
 * el VENDEDOR no necesita esta información para operar el POS.
 */
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly servicio: ProveedoresService) {}

  /** GET /api/proveedores — cualquier usuario autenticado puede consultarlos. */
  @Get()
  listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query('incluirInactivos') incluirInactivos?: string,
  ) {
    return this.servicio.listar(usuario.botica_id, incluirInactivos === 'true');
  }

  /** POST /api/proveedores — registrar un proveedor nuevo. */
  @Roles(RolUsuario.ALMACENERO)
  @Post()
  crear(@UsuarioActual() usuario: PerfilUsuario, @Body() dto: CrearProveedorDto) {
    return this.servicio.crear(usuario.botica_id, dto);
  }

  /** PATCH /api/proveedores/:id — actualizar datos de contacto. */
  @Roles(RolUsuario.ALMACENERO)
  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarProveedorDto,
  ) {
    return this.servicio.actualizar(usuario.botica_id, id, dto);
  }

  /** DELETE /api/proveedores/:id — baja lógica (solo ADMIN). */
  @Roles(RolUsuario.ADMIN)
  @Delete(':id')
  desactivar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicio.desactivar(usuario.botica_id, id);
  }
}
