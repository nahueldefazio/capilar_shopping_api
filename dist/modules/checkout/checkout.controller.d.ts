import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from './dto/checkout.dto';
export declare class CheckoutController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(dto: CreateOrderDto): Promise<import("../orders/entities/order.entity").Order>;
}
