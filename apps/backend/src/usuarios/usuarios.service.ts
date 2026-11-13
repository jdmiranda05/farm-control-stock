import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RolUsuario, Usuario } from '@botica/comun';
import { SupabaseService } from '../supabase/supabase.service';
import { olvidarSesionesDe } from '../autenticacion/guardias/guardia-autenticacion.guard';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './dto/usuario.dto';

/**
 * Gestión del personal de la botica (exclusiva del ADMIN).
 *
 * Cada usuario existe en DOS lugares que comparten el mismo UUID:
 *   1. Supabase Auth (`auth.users`): correo y contraseña para iniciar sesión.
 *   2. La tabla `usuarios`: rol y botica (el perfil de negocio).
 * Al crear, se escriben ambos; si el segundo falla, se deshace el primero.
 *
 * Reglas:
 *   - El ADMIN solo crea ALMACENEROS y VENDEDORES de SU botica.
 *   - No puede editar, desactivar ni cambiar la contraseña de otro ADMIN
 *     ni la suya propia desde aquí (evita quedarse sin acceso).
 *   - Desactivar no borra: conserva el historial (ventas, kardex) del usuario.
 */
@Injectable()
export class UsuariosService {
  private readonly registrador = new Logger(UsuariosService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async listar(boticaId: string): Promise<Usuario[]> {
    const { data, error } = await this.supabase.cliente
      .from('usuarios')
      .select('*')
      .eq('botica_id', boticaId)
      .order('rol')
      .order('nombre_completo');
    this.supabase.verificarError(error, 'listar los usuarios');
    return (data ?? []) as Usuario[];
  }

  async crear(boticaId: string, dto: CrearUsuarioDto): Promise<Usuario> {
    const correo = dto.correo.trim().toLowerCase();
    const nombre = dto.nombreCompleto.trim().replace(/\s+/g, ' ');

    // ¿El correo ya pertenece a alguien (de esta u otra botica)?
    const { data: existente } = await this.supabase.cliente
      .from('usuarios')
      .select('id')
      .eq('correo', correo)
      .maybeSingle();
    if (existente) throw new BadRequestException(`Ya existe un usuario con el correo ${correo}`);

    // 1) Cuenta de acceso en Supabase Auth (confirmada: el ADMIN la entrega)
    const { data: cuenta, error: errorAuth } = await this.supabase.cliente.auth.admin.createUser({
      email: correo,
      password: dto.contrasena,
      email_confirm: true,
      user_metadata: { nombre_completo: nombre },
    });
    if (errorAuth || !cuenta.user) {
      const yaRegistrado = /already|registered|exists/i.test(errorAuth?.message ?? '');
      throw new BadRequestException(
        yaRegistrado
          ? `El correo ${correo} ya tiene una cuenta de acceso registrada`
          : `No se pudo crear la cuenta de acceso: ${errorAuth?.message ?? 'error desconocido'}`,
      );
    }

    // 2) Perfil de negocio; si falla, se elimina la cuenta para no dejarla huérfana
    const { data, error } = await this.supabase.cliente
      .from('usuarios')
      .insert({
        id: cuenta.user.id,
        botica_id: boticaId,
        nombre_completo: nombre,
        correo,
        rol: dto.rol,
      })
      .select()
      .single();
    if (error) {
      await this.supabase.cliente.auth.admin.deleteUser(cuenta.user.id).catch((e) => {
        this.registrador.error(`No se pudo revertir la cuenta ${correo}`, e);
      });
      this.supabase.verificarError(error, 'registrar el perfil del usuario');
    }
    return data as Usuario;
  }

  /** Busca un usuario de la botica que el ADMIN tenga permitido gestionar. */
  private async obtenerGestionable(
    boticaId: string,
    usuarioId: string,
    adminId: string,
  ): Promise<Usuario> {
    if (usuarioId === adminId) {
      throw new ForbiddenException('No puede modificar su propia cuenta desde esta pantalla');
    }
    const { data } = await this.supabase.cliente
      .from('usuarios')
      .select('*')
      .eq('botica_id', boticaId)
      .eq('id', usuarioId)
      .maybeSingle();
    if (!data) throw new NotFoundException('Usuario no encontrado en esta botica');
    if (data.rol === RolUsuario.ADMIN) {
      throw new ForbiddenException('No puede modificar a otro administrador');
    }
    return data as Usuario;
  }

  async actualizar(
    boticaId: string,
    usuarioId: string,
    adminId: string,
    dto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    await this.obtenerGestionable(boticaId, usuarioId, adminId);
    const cambios: Record<string, unknown> = {};
    if (dto.nombreCompleto !== undefined) {
      cambios.nombre_completo = dto.nombreCompleto.trim().replace(/\s+/g, ' ');
    }
    if (dto.rol !== undefined) cambios.rol = dto.rol;
    if (Object.keys(cambios).length === 0) {
      throw new BadRequestException('No se envió ningún cambio');
    }

    const { data, error } = await this.supabase.cliente
      .from('usuarios')
      .update(cambios)
      .eq('botica_id', boticaId)
      .eq('id', usuarioId)
      .select()
      .single();
    this.supabase.verificarError(error, 'actualizar el usuario');
    olvidarSesionesDe(usuarioId); // el nuevo rol rige desde su próxima acción
    return data as Usuario;
  }

  async cambiarEstado(
    boticaId: string,
    usuarioId: string,
    adminId: string,
    activo: boolean,
  ): Promise<{ mensaje: string }> {
    const usuario = await this.obtenerGestionable(boticaId, usuarioId, adminId);
    if (usuario.activo === activo) {
      throw new BadRequestException(
        `${usuario.nombre_completo} ya está ${activo ? 'activo' : 'desactivado'}`,
      );
    }
    const { error } = await this.supabase.cliente
      .from('usuarios')
      .update({ activo })
      .eq('botica_id', boticaId)
      .eq('id', usuarioId);
    this.supabase.verificarError(error, 'cambiar el estado del usuario');
    olvidarSesionesDe(usuarioId); // desactivado = sin acceso de inmediato
    return {
      mensaje: activo
        ? `${usuario.nombre_completo} puede volver a iniciar sesión.`
        : `${usuario.nombre_completo} ya no podrá iniciar sesión. Su historial se conserva.`,
    };
  }

  async restablecerContrasena(
    boticaId: string,
    usuarioId: string,
    adminId: string,
    contrasena: string,
  ): Promise<{ mensaje: string }> {
    const usuario = await this.obtenerGestionable(boticaId, usuarioId, adminId);
    const { error } = await this.supabase.cliente.auth.admin.updateUserById(usuarioId, {
      password: contrasena,
    });
    if (error) throw new BadRequestException(`No se pudo cambiar la contraseña: ${error.message}`);
    return {
      mensaje: `Contraseña de ${usuario.nombre_completo} restablecida. Entréguesela de forma segura.`,
    };
  }
}
