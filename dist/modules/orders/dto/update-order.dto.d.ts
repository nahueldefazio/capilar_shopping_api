import { OrderStatus } from '../../../common/enums/order-status.enum';
import { PaymentStatus } from '../../../common/enums/payment.enum';
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
}
export declare class UpdatePaymentStatusDto {
    paymentStatus: PaymentStatus;
}
