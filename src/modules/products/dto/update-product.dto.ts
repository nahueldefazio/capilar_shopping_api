import { PartialType } from '@nestjs/mapped-types';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class UpdateStockDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;
}
