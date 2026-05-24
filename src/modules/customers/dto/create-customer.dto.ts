import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { SaleType } from '../../../common/enums/sale-type.enum';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(SaleType)
  @IsOptional()
  customerType?: SaleType;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}
