import { Order } from '../../orders/entities/order.entity';
import { SaleType } from '../../../common/enums/sale-type.enum';
export declare class Customer {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    customerType: SaleType;
    address: string;
    province: string;
    city: string;
    postalCode: string;
    orders: Order[];
    createdAt: Date;
    updatedAt: Date;
}
