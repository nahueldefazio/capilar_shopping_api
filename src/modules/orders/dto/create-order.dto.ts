import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsEmail,
  IsDefined,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaleType } from '../../../common/enums/sale-type.enum';

const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/;
const PHONE_PATTERN = /^(?!\+?(\d)(?:[\s().-]*\1){7,}[\s().-]*$)\+?[\d\s().-]{8,22}$/;
const CITY_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .'-]{2,80}$/;
const STREET_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .'-]{2,100}$/;
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9]{4,8}$/;
const STREET_NUMBER_PATTERN = /^[1-9][0-9]{0,5}[A-Za-z]?$/;
const APARTMENT_PATTERN = /^[A-Za-z0-9 .°º/-]{0,30}$/;

export class OrderItemInputDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class OrderCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 80)
  @Matches(NAME_PATTERN)
  fullName: string;

  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(22)
  @Matches(PHONE_PATTERN)
  phone?: string;

  @IsEnum(SaleType)
  @IsOptional()
  customerType?: SaleType;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  province?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(8)
  postalCode?: string;
}

export class OrderShippingInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  province: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  @Matches(CITY_PATTERN)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Matches(POSTAL_CODE_PATTERN)
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @Matches(STREET_PATTERN)
  street: string;

  @IsString()
  @IsNotEmpty()
  @Matches(STREET_NUMBER_PATTERN)
  streetNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Matches(APARTMENT_PATTERN)
  apartment?: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => OrderCustomerDto)
  customer: OrderCustomerDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => OrderShippingInputDto)
  shipping: OrderShippingInputDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
