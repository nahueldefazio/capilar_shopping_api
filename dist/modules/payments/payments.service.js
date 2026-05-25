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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./entities/payment.entity");
const orders_service_1 = require("../orders/orders.service");
const payment_enum_1 = require("../../common/enums/payment.enum");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    paymentRepo;
    ordersService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(paymentRepo, ordersService) {
        this.paymentRepo = paymentRepo;
        this.ordersService = ordersService;
    }
    async createMercadoPagoPreference(orderId) {
        const order = await this.ordersService.findOne(orderId);
        this.logger.log(`[MP] Creating preference for order ${order.orderNumber}`);
        const mockPreferenceId = `MOCK-PREF-${order.orderNumber}`;
        const mockInitPoint = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mockPreferenceId}`;
        return { preferenceId: mockPreferenceId, initPoint: mockInitPoint };
    }
    async handleMercadoPagoWebhook(payload) {
        this.logger.log('[MP Webhook] Received payload:', JSON.stringify(payload));
        if (payload.type === 'payment' && payload.data) {
            const data = payload.data;
            const providerPaymentId = String(data.id ?? '');
            await this.paymentRepo.save(this.paymentRepo.create({
                provider: payment_enum_1.PaymentProvider.MERCADOPAGO,
                providerPaymentId,
                status: payment_enum_1.PaymentStatus.PENDING,
                amount: 0,
                rawResponse: payload,
            }));
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        orders_service_1.OrdersService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map