import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** DTO de creación de categoría (POST /api/categorias). */
export class CrearCategoriaDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @Matches(/\S/, { message: 'El nombre de la categoría no puede estar vacío' })
  @MaxLength(60, { message: 'El nombre de la categoría no puede superar 60 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
