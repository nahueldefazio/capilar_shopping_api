import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
export declare class OrderItem {
    id: number;
    order: Order;
    orderId: number;
    product: Product;
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    createdAt: Date;
}
