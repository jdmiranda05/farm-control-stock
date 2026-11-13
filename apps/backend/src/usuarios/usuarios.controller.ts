import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { UsuariosService } from './usuarios.service';
import {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  RestablecerContrasenaDto,
} from './dto/usuario.dto';

/**
 * Endpoints del personal de la botica. TODOS son exclusivos del ADMIN
 * (decorador a nivel de clase).
 */
@Roles(RolUsuario.ADMIN)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly servicio: UsuariosService) {}

  /** GET /api/usuarios — personal de la botica. */
  @Get()
  listar(@UsuarioActual() usuario: PerfilUsuario) {
    return this.servicio.listar(usuario.botica_id);
  }

  /** POST /api/usuarios — crear almacenero o vendedor. */
  @Post()
  crear(@UsuarioActual() usuario: PerfilUsuario, @Body() dto: CrearUsuarioDto) {
    return this.servicio.crear(usuario.botica_id, dto);
  }

  /** PATCH /api/usuarios/:id — cambiar nombre o rol. */
  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.servicio.actualizar(usuario.botica_id, id, usuario.id, dto);
  }

  /** PATCH /api/usuarios/:id/desactivar — quitar el acceso (conserva historial). */
  @Patch(':id/desactivar')
  desactivar(@UsuarioActual() usuario: PerfilUsuario, @Param('id', ParseUUIDPipe) id: string) {
    return this.servicio.cambiarEstado(usuario.botica_id, id, usuario.id, false);
  }

  /** PATCH /api/usuarios/:id/reactivar — devolver el acceso. */
  @Patch(':id/reactivar')
  reactivar(@UsuarioActual() usuario: PerfilUsuario, @Param('id', ParseUUIDPipe) id: string) {
    return this.servicio.cambiarEstado(usuario.botica_id, id, usuario.id, true);
  }

  /** PATCH /api/usuarios/:id/contrasena — fijar una contraseña temporal nueva. */
  @Patch(':id/contrasena')
  restablecerContrasena(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestablecerContrasenaDto,
  ) {
    return this.servicio.restablecerContrasena(usuario.botica_id, id, usuario.id, dto.contrasena);
  }
}
