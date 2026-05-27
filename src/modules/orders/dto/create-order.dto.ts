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
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../common/enums/payment.enum';
import { DeliveryMethod } from '../../../common/enums/delivery-method.enum';
import { SaleType } from '../../../common/enums/sale-type.enum';

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

export class OrderShippingInputDto {
  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  streetNumber: string;

  @IsString()
  @IsOptional()
  apartment?: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => OrderCustomerDto)
  customer: OrderCustomerDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => OrderShippingInputDto)
  shipping?: OrderShippingInputDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @IsString()
  @IsOptional()
  notes?: string;
}
