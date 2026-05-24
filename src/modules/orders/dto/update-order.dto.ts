import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { PaymentStatus } from '../../../common/enums/payment.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}
