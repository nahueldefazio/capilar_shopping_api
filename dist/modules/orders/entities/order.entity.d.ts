import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { OrderShipping } from './order-shipping.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';
import { DeliveryMethod } from '../../../common/enums/delivery-method.enum';
import { ShippingZone } from '../../../common/enums/shipping-zone.enum';
export declare class Order {
    id: number;
    orderNumber: string;
    publicToken: string | null;
    customer: Customer;
    customerId: number;
    items: OrderItem[];
    shipping: OrderShipping;
    subtotal: number;
    shippingCost: number;
    total: number;
    shippingZone: ShippingZone | null;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    stockDeducted: boolean;
    deliveryMethod: DeliveryMethod;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
