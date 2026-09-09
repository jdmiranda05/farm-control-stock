import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoriaDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  nombre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  descripcion?: string;

  @IsOptional()
  activo?: boolean;
}
