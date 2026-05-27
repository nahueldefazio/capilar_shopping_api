import { PaymentMethod } from '../../../common/enums/payment.enum';
import { DeliveryMethod } from '../../../common/enums/delivery-method.enum';
import { SaleType } from '../../../common/enums/sale-type.enum';
export declare class OrderItemInputDto {
    productId: number;
    quantity: number;
}
export declare class OrderCustomerDto {
    fullName: string;
    email: string;
    phone?: string;
    customerType?: SaleType;
    address?: string;
    province?: string;
    city?: string;
    postalCode?: string;
}
export declare class OrderShippingInputDto {
    province: string;
    city: string;
    postalCode: string;
    street: string;
    streetNumber: string;
    apartment?: string;
}
export declare class CreateOrderDto {
    customer: OrderCustomerDto;
    shipping?: OrderShippingInputDto;
    items: OrderItemInputDto[];
    paymentMethod: PaymentMethod;
    deliveryMethod: DeliveryMethod;
    notes?: string;
}
