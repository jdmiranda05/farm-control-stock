import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { RolUsuario } from '@botica/comun';

/** Roles que el ADMIN puede asignar: no se crean otros administradores. */
export const ROLES_ASIGNABLES = [RolUsuario.ALMACENERO, RolUsuario.VENDEDOR] as const;

/** Contraseña temporal: 8+ caracteres con al menos una letra y un número. */
const PATRON_CONTRASENA = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const MENSAJE_CONTRASENA =
  'La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número';

/** DTO de alta de usuario (POST /api/usuarios). */
export class CrearUsuarioDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @Length(3, 80, { message: 'El nombre completo debe tener entre 3 y 80 caracteres' })
  @Matches(/^[\p{L} .'-]+$/u, { message: 'El nombre solo puede contener letras y espacios' })
  nombreCompleto: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(254, { message: 'El correo es demasiado largo' })
  correo: string;

  @IsIn(ROLES_ASIGNABLES, { message: 'El rol debe ser ALMACENERO o VENDEDOR' })
  rol: RolUsuario;

  @IsString()
  @Matches(PATRON_CONTRASENA, { message: MENSAJE_CONTRASENA })
  contrasena: string;
}

/** DTO de edición (PATCH /api/usuarios/:id): nombre y rol. */
export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @Length(3, 80, { message: 'El nombre completo debe tener entre 3 y 80 caracteres' })
  @Matches(/^[\p{L} .'-]+$/u, { message: 'El nombre solo puede contener letras y espacios' })
  nombreCompleto?: string;

  @IsOptional()
  @IsIn(ROLES_ASIGNABLES, { message: 'El rol debe ser ALMACENERO o VENDEDOR' })
  rol?: RolUsuario;
}

/** DTO para restablecer la contraseña (PATCH /api/usuarios/:id/contrasena). */
export class RestablecerContrasenaDto {
  @IsString()
  @Matches(PATRON_CONTRASENA, { message: MENSAJE_CONTRASENA })
  contrasena: string;
}
