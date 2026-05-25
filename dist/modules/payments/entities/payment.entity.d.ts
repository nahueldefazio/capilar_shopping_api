import { Order } from '../../orders/entities/order.entity';
import { PaymentProvider, PaymentStatus } from '../../../common/enums/payment.enum';
export declare class Payment {
    id: number;
    order: Order;
    orderId: number;
    provider: PaymentProvider;
    providerPaymentId: string;
    status: PaymentStatus;
    amount: number;
    rawResponse: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
