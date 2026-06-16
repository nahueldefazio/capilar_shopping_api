import { OnModuleInit } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderShipping } from './entities/order-shipping.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdateShippingDto } from './dto/update-order.dto';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { EmailsService } from '../emails/emails.service';
export declare class OrdersService implements OnModuleInit {
    private readonly orderRepo;
    private readonly itemRepo;
    private readonly shippingRepo;
    private readonly customersService;
    private readonly productsService;
    private readonly dataSource;
    private readonly emailsService;
    constructor(orderRepo: Repository<Order>, itemRepo: Repository<OrderItem>, shippingRepo: Repository<OrderShipping>, customersService: CustomersService, productsService: ProductsService, dataSource: DataSource, emailsService: EmailsService);
    onModuleInit(): Promise<void>;
    findAll(): Promise<Order[]>;
    findByOrderNumber(orderNumber: string): Promise<Order | null>;
    findOne(id: number): Promise<Order>;
    findOnePublic(id: number, publicToken: string): Promise<Order>;
    create(dto: CreateOrderDto): Promise<Order>;
    updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order>;
    updateShipping(id: number, dto: UpdateShippingDto): Promise<Order>;
    private deductStockForOrder;
}
