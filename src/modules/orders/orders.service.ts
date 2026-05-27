import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdatePaymentStatusDto } from './dto/update-order.dto';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment.enum';
import { generateOrderNumber } from '../../common/utils/slug.util';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['customer', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { orderNumber },
      relations: ['customer', 'items'],
    });
  }

  async findOne(id: number): Promise<Order> {
const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'payments'],
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Resolve or create customer
      const customer = await this.customersService.findOrCreateByEmail(dto.customer);

      // 2. Validate products and calculate total from backend (never trust frontend totals)
      const resolvedItems: Array<{
        product: Awaited<ReturnType<ProductsService['findById']>>;
        quantity: number;
      }> = [];

      for (const itemDto of dto.items) {
        const product = await this.productsService.findById(itemDto.productId);
        if (!product.isActive) {
          throw new BadRequestException(`Product "${product.name}" is not available`);
        }
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          );
        }
        resolvedItems.push({ product, quantity: itemDto.quantity });
      }

      // 3. Compute total server-side
      const total = resolvedItems.reduce(
        (sum, { product, quantity }) => sum + Number(product.price) * quantity,
        0,
      );

      // 4. Generate order number
      const count = await manager.count(Order);
      const orderNumber = generateOrderNumber(count + 1);

      // 5. Build order
      const order = manager.create(Order, {
        orderNumber,
        customerId: customer.id,
        total: Math.round(total * 100) / 100,
        status: OrderStatus.CREATED,
        paymentMethod: dto.paymentMethod,
        deliveryMethod: dto.deliveryMethod,
        notes: dto.notes ?? '',
      });
      const savedOrder = await manager.save(Order, order);

      // 6. Save items as snapshots (name and price at time of purchase)
      const items = resolvedItems.map(({ product, quantity }) =>
        manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: product.id,
          productName: product.name,       // snapshot
          unitPrice: Number(product.price), // snapshot
          quantity,
          subtotal: Math.round(Number(product.price) * quantity * 100) / 100,
        }),
      );
      const savedItems = await manager.save(OrderItem, items);

      // 7. Decrement stock atomically within the transaction
      for (const { product, quantity } of resolvedItems) {
        await manager.decrement(Product, { id: product.id }, 'stock', quantity);
      }

      savedOrder.customer = customer;
      savedOrder.items = savedItems;
      savedOrder.payments = [];
      return savedOrder;
    });
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = dto.status;
    await this.orderRepo.save(order);
    return this.findOne(id);
  }

  async updatePaymentStatus(id: number, dto: UpdatePaymentStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    const wasNotPaid = order.paymentStatus !== PaymentStatus.APPROVED;

    order.paymentStatus = dto.paymentStatus;

    if (dto.paymentStatus === PaymentStatus.APPROVED && wasNotPaid) {
      order.status = OrderStatus.PAID;
    }

    await this.orderRepo.save(order);
    return this.findOne(id);
  }
}
