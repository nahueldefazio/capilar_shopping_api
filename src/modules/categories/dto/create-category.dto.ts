import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  parentId?: number;
}
