"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const order_shipping_entity_1 = require("./entities/order-shipping.entity");
const product_entity_1 = require("../products/entities/product.entity");
const customers_service_1 = require("../customers/customers.service");
const products_service_1 = require("../products/products.service");
const order_status_enum_1 = require("../../common/enums/order-status.enum");
const slug_util_1 = require("../../common/utils/slug.util");
const emails_service_1 = require("../emails/emails.service");
let OrdersService = class OrdersService {
    orderRepo;
    itemRepo;
    shippingRepo;
    customersService;
    productsService;
    dataSource;
    emailsService;
    constructor(orderRepo, itemRepo, shippingRepo, customersService, productsService, dataSource, emailsService) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.shippingRepo = shippingRepo;
        this.customersService = customersService;
        this.productsService = productsService;
        this.dataSource = dataSource;
        this.emailsService = emailsService;
    }
    async onModuleInit() {
        await this.orderRepo.query(`
      UPDATE orders
      SET publicToken = SHA2(CONCAT(id, '-', orderNumber, '-', createdAt), 256)
      WHERE publicToken IS NULL OR publicToken = ''
    `);
    }
    findAll() {
        return this.orderRepo.find({
            relations: ['customer', 'items', 'shipping'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByOrderNumber(orderNumber) {
        return this.orderRepo.findOne({
            where: { orderNumber },
            relations: ['customer', 'items', 'shipping'],
        });
    }
    async findOne(id) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: ['customer', 'items', 'shipping'],
        });
        if (!order)
            throw new common_1.NotFoundException(`Order #${id} not found`);
        return order;
    }
    async findOnePublic(id, publicToken) {
        if (!publicToken)
            throw new common_1.NotFoundException(`Order #${id} not found`);
        const order = await this.orderRepo.findOne({
            where: { id, publicToken },
            relations: ['customer', 'items', 'shipping'],
        });
        if (!order)
            throw new common_1.NotFoundException(`Order #${id} not found`);
        return order;
    }
    async create(dto) {
        const order = await this.dataSource.transaction(async (manager) => {
            const customer = await this.customersService.findOrCreateByEmail(dto.customer);
            const resolvedItems = [];
            for (const itemDto of dto.items) {
                const product = await this.productsService.findById(itemDto.productId);
                if (!product.isActive) {
                    throw new common_1.BadRequestException(`Product "${product.name}" is not available`);
                }
                if (product.stock < itemDto.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
                }
                resolvedItems.push({ product, quantity: itemDto.quantity });
            }
            const subtotal = resolvedItems.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0);
            const total = Math.round(subtotal);
            const orderNumber = (0, slug_util_1.generateOrderNumber)();
            const order = manager.create(order_entity_1.Order, {
                orderNumber,
                publicToken: (0, crypto_1.randomBytes)(32).toString('hex'),
                customerId: customer.id,
                subtotal: Math.round(subtotal),
                total,
                status: order_status_enum_1.OrderStatus.RESERVED,
                notes: dto.notes ?? '',
            });
            const savedOrder = await manager.save(order_entity_1.Order, order);
            const items = resolvedItems.map(({ product, quantity }) => manager.create(order_item_entity_1.OrderItem, {
                orderId: savedOrder.id,
                productId: product.id,
                productName: product.name,
                unitPrice: Number(product.price),
                quantity,
                subtotal: Math.round(Number(product.price) * quantity),
            }));
            const savedItems = await manager.save(order_item_entity_1.OrderItem, items);
            savedOrder.items = savedItems;
            await this.deductStockForOrder(manager, savedOrder);
            savedOrder.stockDeducted = true;
            await manager.save(order_entity_1.Order, savedOrder);
            const shippingRecord = manager.create(order_shipping_entity_1.OrderShipping, {
                orderId: savedOrder.id,
                province: dto.shipping.province,
                city: dto.shipping.city,
                postalCode: dto.shipping.postalCode,
                street: dto.shipping.street,
                streetNumber: dto.shipping.streetNumber,
                apartment: dto.shipping.apartment ?? undefined,
            });
            const savedShipping = await manager.save(order_shipping_entity_1.OrderShipping, shippingRecord);
            savedOrder.customer = customer;
            savedOrder.items = savedItems;
            savedOrder.shipping = savedShipping;
            return savedOrder;
        });
        await this.emailsService.sendOrderCreated(order);
        return order;
    }
    async updateStatus(id, dto) {
        const order = await this.findOne(id);
        order.status = dto.status;
        await this.orderRepo.save(order);
        return this.findOne(id);
    }
    async updateShipping(id, dto) {
        const order = await this.findOne(id);
        if (!order.shipping) {
            throw new common_1.BadRequestException(`Order #${id} has no shipping record`);
        }
        const previousShippingStatus = order.shipping.status;
        const previousTrackingNumber = order.shipping.trackingNumber;
        const previousTrackingUrl = order.shipping.trackingUrl;
        if (dto.shippingStatus !== undefined)
            order.shipping.status = dto.shippingStatus;
        if (dto.trackingNumber !== undefined)
            order.shipping.trackingNumber = dto.trackingNumber;
        if (dto.trackingUrl !== undefined)
            order.shipping.trackingUrl = dto.trackingUrl;
        if (dto.shippingStatus === 'shipped') {
            order.status = order_status_enum_1.OrderStatus.SHIPPED;
        }
        if (dto.shippingStatus === 'delivered') {
            order.status = order_status_enum_1.OrderStatus.DELIVERED;
        }
        await this.shippingRepo.save(order.shipping);
        await this.orderRepo.save(order);
        const updated = await this.findOne(id);
        const shippingChanged = previousShippingStatus !== updated.shipping?.status ||
            previousTrackingNumber !== updated.shipping?.trackingNumber ||
            previousTrackingUrl !== updated.shipping?.trackingUrl;
        if (shippingChanged) {
            await this.emailsService.sendShippingUpdated(updated);
        }
        return updated;
    }
    async deductStockForOrder(manager, order) {
        for (const item of order.items) {
            if (!item.productId) {
                throw new common_1.BadRequestException(`Product reference missing for item "${item.productName}"`);
            }
            const product = await manager.findOne(product_entity_1.Product, {
                where: { id: item.productId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!product)
                throw new common_1.NotFoundException(`Product #${item.productId} not found`);
            if (product.stock < item.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
            }
            product.stock -= item.quantity;
            await manager.save(product_entity_1.Product, product);
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(order_shipping_entity_1.OrderShipping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        customers_service_1.CustomersService,
        products_service_1.ProductsService,
        typeorm_2.DataSource,
        emails_service_1.EmailsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map