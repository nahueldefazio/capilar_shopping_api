import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderShipping } from './entities/order-shipping.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdatePaymentStatusDto, UpdateShippingDto } from './dto/update-order.dto';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { ShippingService } from '../shipping/shipping.service';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment.enum';
import { DeliveryMethod } from '../../common/enums/delivery-method.enum';
import { generateOrderNumber } from '../../common/utils/slug.util';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderShipping)
    private readonly shippingRepo: Repository<OrderShipping>,
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
    private readonly shippingService: ShippingService,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['customer', 'items', 'shipping'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { orderNumber },
      relations: ['customer', 'items', 'shipping'],
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'payments', 'shipping'],
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Resolve or create customer
      const customer = await this.customersService.findOrCreateByEmail(dto.customer);

      // 2. Validate products and calculate totals from DB (never trust frontend prices)
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

      // 3. Compute subtotal server-side
      const subtotal = resolvedItems.reduce(
        (sum, { product, quantity }) => sum + Number(product.price) * quantity,
        0,
      );

      // 4. Calculate shipping cost server-side
      const needsShipping = dto.deliveryMethod === DeliveryMethod.HOME_DELIVERY;
      let shippingCost = 0;
      let shippingZone = null;

      if (needsShipping) {
        const totalWeightGrams = resolvedItems.reduce(
          (sum, { product, quantity }) => sum + (product.weightGrams ?? 0) * quantity,
          0,
        );
        const province = dto.shipping?.province ?? dto.customer.province ?? '';
        const shippingResult = await this.shippingService.calculateFromWeight(
          province,
          totalWeightGrams,
          dto.deliveryMethod,
        );
        shippingCost = shippingResult.shippingCost ?? 0;
        shippingZone = shippingResult.zone;
      }

      const total = Math.round((subtotal + shippingCost) * 100) / 100;

      // 5. Generate order number
      const count = await manager.count(Order);
      const orderNumber = generateOrderNumber(count + 1);

      // 6. Build order
      const order = manager.create(Order, {
        orderNumber,
        customerId: customer.id,
        subtotal: Math.round(subtotal * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        shippingZone,
        total,
        status: OrderStatus.CREATED,
        paymentMethod: dto.paymentMethod,
        deliveryMethod: dto.deliveryMethod,
        notes: dto.notes ?? '',
      });
      const savedOrder = await manager.save(Order, order);

      // 7. Save items as snapshots
      const items = resolvedItems.map(({ product, quantity }) =>
        manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: product.id,
          productName: product.name,
          unitPrice: Number(product.price),
          quantity,
          subtotal: Math.round(Number(product.price) * quantity * 100) / 100,
        }),
      );
      const savedItems = await manager.save(OrderItem, items);

      // 8. Save shipping address if home delivery
      let savedShipping: OrderShipping | undefined;
      if (needsShipping && dto.shipping) {
        const shippingRecord = manager.create(OrderShipping, {
          orderId: savedOrder.id,
          province: dto.shipping.province,
          city: dto.shipping.city,
          postalCode: dto.shipping.postalCode,
          street: dto.shipping.street,
          streetNumber: dto.shipping.streetNumber,
          apartment: dto.shipping.apartment ?? undefined,
        });
        savedShipping = await manager.save(OrderShipping, shippingRecord);
      }

      // 9. Decrement stock atomically
      for (const { product, quantity } of resolvedItems) {
        await manager.decrement(Product, { id: product.id }, 'stock', quantity);
      }

      savedOrder.customer = customer;
      savedOrder.items = savedItems;
      savedOrder.shipping = savedShipping as OrderShipping;
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

  async updateShipping(id: number, dto: UpdateShippingDto): Promise<Order> {
    const order = await this.findOne(id);

    if (!order.shipping) {
      throw new BadRequestException(`Order #${id} has no shipping record`);
    }

    if (dto.shippingStatus !== undefined) order.shipping.status = dto.shippingStatus;
    if (dto.trackingNumber !== undefined) order.shipping.trackingNumber = dto.trackingNumber;
    if (dto.trackingUrl !== undefined) order.shipping.trackingUrl = dto.trackingUrl;

    if (dto.shippingStatus === 'shipped' && order.status === OrderStatus.PAID) {
      order.status = OrderStatus.SHIPPED;
    }
    if (dto.shippingStatus === 'delivered') {
      order.status = OrderStatus.DELIVERED;
    }

    await this.shippingRepo.save(order.shipping);
    await this.orderRepo.save(order);
    return this.findOne(id);
  }
}
