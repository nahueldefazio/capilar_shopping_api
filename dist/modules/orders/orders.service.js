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
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const product_entity_1 = require("../products/entities/product.entity");
const customers_service_1 = require("../customers/customers.service");
const products_service_1 = require("../products/products.service");
const order_status_enum_1 = require("../../common/enums/order-status.enum");
const payment_enum_1 = require("../../common/enums/payment.enum");
const slug_util_1 = require("../../common/utils/slug.util");
let OrdersService = class OrdersService {
    orderRepo;
    itemRepo;
    customersService;
    productsService;
    dataSource;
    constructor(orderRepo, itemRepo, customersService, productsService, dataSource) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.customersService = customersService;
        this.productsService = productsService;
        this.dataSource = dataSource;
    }
    findAll() {
        return this.orderRepo.find({
            relations: ['customer', 'items'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByOrderNumber(orderNumber) {
        return this.orderRepo.findOne({
            where: { orderNumber },
            relations: ['customer', 'items'],
        });
    }
    async findOne(id) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: ['customer', 'items', 'payments'],
        });
        if (!order)
            throw new common_1.NotFoundException(`Order #${id} not found`);
        return order;
    }
    async create(dto) {
        return this.dataSource.transaction(async (manager) => {
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
            const total = resolvedItems.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0);
            const count = await manager.count(order_entity_1.Order);
            const orderNumber = (0, slug_util_1.generateOrderNumber)(count + 1);
            const order = manager.create(order_entity_1.Order, {
                orderNumber,
                customerId: customer.id,
                total: Math.round(total * 100) / 100,
                status: order_status_enum_1.OrderStatus.CREATED,
                paymentMethod: dto.paymentMethod,
                deliveryMethod: dto.deliveryMethod,
                notes: dto.notes ?? '',
            });
            const savedOrder = await manager.save(order_entity_1.Order, order);
            const items = resolvedItems.map(({ product, quantity }) => manager.create(order_item_entity_1.OrderItem, {
                orderId: savedOrder.id,
                productId: product.id,
                productName: product.name,
                unitPrice: Number(product.price),
                quantity,
                subtotal: Math.round(Number(product.price) * quantity * 100) / 100,
            }));
            const savedItems = await manager.save(order_item_entity_1.OrderItem, items);
            for (const { product, quantity } of resolvedItems) {
                await manager.decrement(product_entity_1.Product, { id: product.id }, 'stock', quantity);
            }
            savedOrder.customer = customer;
            savedOrder.items = savedItems;
            savedOrder.payments = [];
            return savedOrder;
        });
    }
    async updateStatus(id, dto) {
        const order = await this.findOne(id);
        order.status = dto.status;
        await this.orderRepo.save(order);
        return this.findOne(id);
    }
    async updatePaymentStatus(id, dto) {
        const order = await this.findOne(id);
        const wasNotPaid = order.paymentStatus !== payment_enum_1.PaymentStatus.APPROVED;
        order.paymentStatus = dto.paymentStatus;
        if (dto.paymentStatus === payment_enum_1.PaymentStatus.APPROVED && wasNotPaid) {
            order.status = order_status_enum_1.OrderStatus.PAID;
        }
        await this.orderRepo.save(order);
        return this.findOne(id);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        customers_service_1.CustomersService,
        products_service_1.ProductsService,
        typeorm_2.DataSource])
], OrdersService);
//# sourceMappingURL=orders.service.js.map