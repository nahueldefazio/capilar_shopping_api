import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderShipping } from './entities/order-shipping.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdatePaymentStatusDto, UpdateShippingDto } from './dto/update-order.dto';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { ShippingService } from '../shipping/shipping.service';
export declare class OrdersService {
    private readonly orderRepo;
    private readonly itemRepo;
    private readonly shippingRepo;
    private readonly customersService;
    private readonly productsService;
    private readonly shippingService;
    private readonly dataSource;
    constructor(orderRepo: Repository<Order>, itemRepo: Repository<OrderItem>, shippingRepo: Repository<OrderShipping>, customersService: CustomersService, productsService: ProductsService, shippingService: ShippingService, dataSource: DataSource);
    findAll(): Promise<Order[]>;
    findByOrderNumber(orderNumber: string): Promise<Order | null>;
    findOne(id: number): Promise<Order>;
    create(dto: CreateOrderDto): Promise<Order>;
    updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order>;
    updatePaymentStatus(id: number, dto: UpdatePaymentStatusDto): Promise<Order>;
    updateShipping(id: number, dto: UpdateShippingDto): Promise<Order>;
}
