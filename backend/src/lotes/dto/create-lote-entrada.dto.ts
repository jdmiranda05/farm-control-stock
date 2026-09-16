import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLoteEntradaDto {
  @IsInt()
  @IsPositive()
  producto_id: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  proveedor_id?: number;

  @IsString()
  @MaxLength(100)
  codigo_lote: string;

  @IsInt()
  @IsPositive()
  cantidad: number;

  @IsDateString()
  fecha_vencimiento: string;

  @IsNumber()
  @IsPositive()
  precio_compra: number;
}
