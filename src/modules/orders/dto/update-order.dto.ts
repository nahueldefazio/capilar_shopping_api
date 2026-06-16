import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { ShippingStatus } from '../../../common/enums/shipping-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class UpdateShippingDto {
  @IsEnum(ShippingStatus)
  @IsOptional()
  shippingStatus?: ShippingStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  trackingUrl?: string;
}
