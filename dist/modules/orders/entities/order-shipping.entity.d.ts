import { Order } from './order.entity';
import { ShippingStatus } from '../../../common/enums/shipping-status.enum';
export declare class OrderShipping {
    id: number;
    order: Order;
    orderId: number;
    status: ShippingStatus;
    province: string;
    city: string;
    postalCode: string;
    street: string;
    streetNumber: string;
    apartment: string;
    trackingNumber: string;
    trackingUrl: string;
    createdAt: Date;
    updatedAt: Date;
}
