import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsUrl,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaleType } from '../../../common/enums/sale-type.enum';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsEnum(SaleType)
  @IsOptional()
  saleType?: SaleType;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}
