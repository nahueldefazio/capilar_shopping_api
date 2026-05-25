import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdatePaymentStatusDto } from './dto/update-order.dto';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
export declare class OrdersService {
    private readonly orderRepo;
    private readonly itemRepo;
    private readonly customersService;
    private readonly productsService;
    private readonly dataSource;
    constructor(orderRepo: Repository<Order>, itemRepo: Repository<OrderItem>, customersService: CustomersService, productsService: ProductsService, dataSource: DataSource);
    findAll(): Promise<Order[]>;
    findOne(id: number): Promise<Order>;
    create(dto: CreateOrderDto): Promise<Order>;
    updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order>;
    updatePaymentStatus(id: number, dto: UpdatePaymentStatusDto): Promise<Order>;
}
