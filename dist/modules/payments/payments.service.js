"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const crypto_1 = require("crypto");
const mercadopago_1 = __importStar(require("mercadopago"));
const payment_entity_1 = require("./entities/payment.entity");
const orders_service_1 = require("../orders/orders.service");
const payment_enum_1 = require("../../common/enums/payment.enum");
const order_status_enum_1 = require("../../common/enums/order-status.enum");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    paymentRepo;
    ordersService;
    logger = new common_1.Logger(PaymentsService_1.name);
    mp;
    constructor(paymentRepo, ordersService) {
        this.paymentRepo = paymentRepo;
        this.ordersService = ordersService;
        this.mp = new mercadopago_1.default({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? '',
        });
    }
    async createMercadoPagoPreference(orderId) {
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            throw new common_1.BadRequestException('Mercado Pago no esta configurado');
        }
        const order = await this.ordersService.findOne(orderId);
        this.logger.log(`[MP] Creating preference for order ${order.orderNumber}`);
        const frontendUrl = process.env.FRONTEND_URL ?? 'https://lemonchiffon-goldfish-284566.hostingersite.com';
        const apiUrl = process.env.API_URL ?? 'https://navajowhite-quetzal-176085.hostingersite.com';
        const preferenceApi = new mercadopago_1.Preference(this.mp);
        const result = await preferenceApi.create({
            body: {
                external_reference: order.orderNumber,
                items: order.items.map((item) => ({
                    id: String(item.productId ?? item.id),
                    title: item.productName,
                    unit_price: Number(item.unitPrice),
                    quantity: item.quantity,
                    currency_id: 'ARS',
                })),
                payer: {
                    name: order.customer?.fullName ?? '',
                    email: order.customer?.email ?? '',
                },
                back_urls: {
                    success: `${frontendUrl}/pago-resultado?order_id=${order.id}&token=${order.publicToken}`,
                    failure: `${frontendUrl}`,
                    pending: `${frontendUrl}/pago-resultado?order_id=${order.id}&token=${order.publicToken}`,
                },
                auto_return: 'approved',
                statement_descriptor: 'Capilar Shopping',
                notification_url: `${apiUrl}/api/payments/mercadopago/webhook`,
            },
        });
        if (!result.id || !result.init_point) {
            throw new common_1.BadRequestException('No se pudo crear la preferencia de pago en Mercado Pago');
        }
        await this.ordersService.updateStatus(orderId, { status: order_status_enum_1.OrderStatus.PENDING_PAYMENT });
        this.logger.log(`[MP] Preference created: ${result.id} for order ${order.orderNumber}`);
        return { preferenceId: result.id, initPoint: result.init_point };
    }
    verifyMPSignature(xSignature, xRequestId, dataId) {
        const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
        if (!secret)
            return process.env.NODE_ENV !== 'production';
        if (!xSignature)
            return false;
        const parts = Object.fromEntries(xSignature.split(',').map((p) => p.trim().split('=')));
        if (!parts.ts || !parts.v1)
            return false;
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
        const expected = (0, crypto_1.createHmac)('sha256', secret).update(manifest).digest('hex');
        return expected === parts.v1;
    }
    async handleMercadoPagoWebhook(body, query, xSignature = '', xRequestId = '') {
        const type = (body.type ?? query.type ?? query.topic);
        const paymentId = String(body.data?.id ??
            query['data.id'] ??
            query.id ??
            '');
        const signatureDataId = query['data.id'] ?? paymentId;
        this.logger.log(`[MP Webhook] type=${type} paymentId=${paymentId}`);
        if (type !== 'payment' || !paymentId)
            return;
        if (!this.verifyMPSignature(xSignature, xRequestId, signatureDataId)) {
            this.logger.warn('[MP Webhook] Invalid signature — request ignored');
            return;
        }
        try {
            const mpApi = new mercadopago_1.Payment(this.mp);
            const paymentInfo = await mpApi.get({ id: paymentId });
            const orderNumber = paymentInfo.external_reference;
            if (!orderNumber) {
                this.logger.warn(`[MP Webhook] No external_reference in payment ${paymentId}`);
                return;
            }
            const order = await this.ordersService.findByOrderNumber(orderNumber);
            if (!order) {
                this.logger.warn(`[MP Webhook] Order not found for reference ${orderNumber}`);
                return;
            }
            const newStatus = this.mapMPStatus(paymentInfo.status ?? '');
            await this.paymentRepo.save(this.paymentRepo.create({
                orderId: order.id,
                provider: payment_enum_1.PaymentProvider.MERCADOPAGO,
                providerPaymentId: paymentId,
                status: newStatus,
                amount: Number(paymentInfo.transaction_amount ?? 0),
                rawResponse: paymentInfo,
            }));
            await this.ordersService.updatePaymentStatus(order.id, { paymentStatus: newStatus });
            this.logger.log(`[MP Webhook] Order ${orderNumber} payment status → ${newStatus}`);
        }
        catch (err) {
            this.logger.error('[MP Webhook] Error processing webhook:', err);
        }
    }
    mapMPStatus(mpStatus) {
        switch (mpStatus) {
            case 'approved': return payment_enum_1.PaymentStatus.APPROVED;
            case 'rejected':
            case 'cancelled': return payment_enum_1.PaymentStatus.REJECTED;
            case 'refunded': return payment_enum_1.PaymentStatus.REFUNDED;
            default: return payment_enum_1.PaymentStatus.PENDING;
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