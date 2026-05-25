import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';
import { DeliveryMethod } from '../../../common/enums/delivery-method.enum';
export declare class Order {
    id: number;
    orderNumber: string;
    customer: Customer;
    customerId: number;
    items: OrderItem[];
    payments: Payment[];
    total: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    deliveryMethod: DeliveryMethod;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
