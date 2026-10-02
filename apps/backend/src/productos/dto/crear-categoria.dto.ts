import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** DTO de creación de categoría (POST /api/categorias). */
export class CrearCategoriaDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
