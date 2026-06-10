import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { randomBytes } from 'crypto';
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
import { PaymentMethod, PaymentStatus } from '../../common/enums/payment.enum';
import { DeliveryMethod } from '../../common/enums/delivery-method.enum';
import { generateOrderNumber } from '../../common/utils/slug.util';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class OrdersService implements OnModuleInit {
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
    private readonly emailsService: EmailsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.orderRepo.query(`
      UPDATE orders
      SET publicToken = SHA2(CONCAT(id, '-', orderNumber, '-', createdAt), 256)
      WHERE publicToken IS NULL OR publicToken = ''
    `);
  }

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

  async findOnePublic(id: number, publicToken: string): Promise<Order> {
    if (!publicToken) throw new NotFoundException(`Order #${id} not found`);

    const order = await this.orderRepo.findOne({
      where: { id, publicToken },
      relations: ['customer', 'items', 'payments', 'shipping'],
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const order = await this.dataSource.transaction(async (manager) => {
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

      // 4. Calculate shipping cost server-side (tarifas planas por zona)
      const needsShipping =
        dto.deliveryMethod === DeliveryMethod.HOME_DELIVERY ||
        dto.deliveryMethod === DeliveryMethod.PICKUP;
      let shippingCost = 0;
      let shippingZone = null;

      if (needsShipping) {
        if (dto.deliveryMethod === DeliveryMethod.HOME_DELIVERY && !dto.shipping) {
          throw new BadRequestException('Shipping address is required for home delivery');
        }
        const province =
          dto.deliveryMethod === DeliveryMethod.HOME_DELIVERY
            ? dto.shipping!.province
            : (dto.customer.province ?? '');
        const city =
          dto.deliveryMethod === DeliveryMethod.HOME_DELIVERY
            ? dto.shipping!.city
            : (dto.customer.city ?? '');
        const shippingResult = this.shippingService.calculateFlat(province, city, dto.deliveryMethod);
        shippingCost = shippingResult.shippingCost ?? 0;
        shippingZone = shippingResult.zone;
      }

      const total = Math.round((subtotal + shippingCost) * 100) / 100;

      // 5. Generate order number
      const orderNumber = generateOrderNumber();

      // 6. Build order
      const order = manager.create(Order, {
        orderNumber,
        publicToken: randomBytes(32).toString('hex'),
        customerId: customer.id,
        subtotal: Math.round(subtotal * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        shippingZone,
        total,
        status:
          dto.paymentMethod === PaymentMethod.TRANSFER
            ? OrderStatus.PENDING_PAYMENT
            : OrderStatus.CREATED,
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

      savedOrder.customer = customer;
      savedOrder.items = savedItems;
      savedOrder.shipping = savedShipping as OrderShipping;
      savedOrder.payments = [];
      return savedOrder;
    });

    await this.emailsService.sendOrderCreated(order);
    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = dto.status;
    await this.orderRepo.save(order);
    return this.findOne(id);
  }

  async updatePaymentStatus(id: number, dto: UpdatePaymentStatusDto): Promise<Order> {
    const result = await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: ['customer', 'items', 'payments', 'shipping'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException(`Order #${id} not found`);

      const shouldDeductStock =
        dto.paymentStatus === PaymentStatus.APPROVED && !order.stockDeducted;

      if (shouldDeductStock) {
        await this.deductStockForOrder(manager, order);
        order.stockDeducted = true;
      }

      order.paymentStatus = dto.paymentStatus;

      if (dto.paymentStatus === PaymentStatus.APPROVED) {
        order.status = OrderStatus.PAID;
      }

      await manager.save(Order, order);
      return { order, paymentApprovedNow: shouldDeductStock };
    });

    const updated = await this.findOne(result.order.id);
    if (result.paymentApprovedNow) {
      await this.emailsService.sendPaymentApproved(updated);
    }
    return updated;
  }

  async updateShipping(id: number, dto: UpdateShippingDto): Promise<Order> {
    const order = await this.findOne(id);

    if (!order.shipping) {
      throw new BadRequestException(`Order #${id} has no shipping record`);
    }

    const previousShippingStatus = order.shipping.status;
    const previousTrackingNumber = order.shipping.trackingNumber;
    const previousTrackingUrl = order.shipping.trackingUrl;

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
    const updated = await this.findOne(id);

    const shippingChanged =
      previousShippingStatus !== updated.shipping?.status ||
      previousTrackingNumber !== updated.shipping?.trackingNumber ||
      previousTrackingUrl !== updated.shipping?.trackingUrl;

    if (shippingChanged) {
      await this.emailsService.sendShippingUpdated(updated);
    }

    return updated;
  }

  private async deductStockForOrder(manager: EntityManager, order: Order): Promise<void> {
    for (const item of order.items) {
      if (!item.productId) {
        throw new BadRequestException(`Product reference missing for item "${item.productName}"`);
      }

      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) throw new NotFoundException(`Product #${item.productId} not found`);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        );
      }

      product.stock -= item.quantity;
      await manager.save(Product, product);
    }
  }
}
