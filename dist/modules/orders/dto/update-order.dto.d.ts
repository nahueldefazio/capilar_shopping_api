import { OrderStatus } from '../../../common/enums/order-status.enum';
import { PaymentStatus } from '../../../common/enums/payment.enum';
import { ShippingStatus } from '../../../common/enums/shipping-status.enum';
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
}
export declare class UpdatePaymentStatusDto {
    paymentStatus: PaymentStatus;
}
export declare class UpdateShippingDto {
    shippingStatus?: ShippingStatus;
    trackingNumber?: string;
    trackingUrl?: string;
}
