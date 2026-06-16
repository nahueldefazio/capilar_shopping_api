import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdateShippingDto } from './dto/update-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findAll(): Promise<import("./entities/order.entity").Order[]>;
    findOne(id: number): Promise<import("./entities/order.entity").Order>;
    create(dto: CreateOrderDto): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<import("./entities/order.entity").Order>;
    updateShipping(id: number, dto: UpdateShippingDto): Promise<import("./entities/order.entity").Order>;
}
