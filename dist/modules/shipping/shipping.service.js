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
var ShippingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shipping_rate_entity_1 = require("./entities/shipping-rate.entity");
const product_entity_1 = require("../products/entities/product.entity");
const shipping_zone_enum_1 = require("../../common/enums/shipping-zone.enum");
const DEFAULT_RATES = [
    { zone: shipping_zone_enum_1.ShippingZone.CABA, minWeightGrams: 0, maxWeightGrams: 1000, price: 4000 },
    { zone: shipping_zone_enum_1.ShippingZone.CABA, minWeightGrams: 1001, maxWeightGrams: 3000, price: 5500 },
    { zone: shipping_zone_enum_1.ShippingZone.CABA, minWeightGrams: 3001, maxWeightGrams: 5000, price: 7000 },
    { zone: shipping_zone_enum_1.ShippingZone.GBA, minWeightGrams: 0, maxWeightGrams: 1000, price: 5000 },
    { zone: shipping_zone_enum_1.ShippingZone.GBA, minWeightGrams: 1001, maxWeightGrams: 3000, price: 6500 },
    { zone: shipping_zone_enum_1.ShippingZone.GBA, minWeightGrams: 3001, maxWeightGrams: 5000, price: 8000 },
    { zone: shipping_zone_enum_1.ShippingZone.INTERIOR, minWeightGrams: 0, maxWeightGrams: 1000, price: 8000 },
    { zone: shipping_zone_enum_1.ShippingZone.INTERIOR, minWeightGrams: 1001, maxWeightGrams: 3000, price: 10000 },
    { zone: shipping_zone_enum_1.ShippingZone.INTERIOR, minWeightGrams: 3001, maxWeightGrams: 5000, price: 13000 },
];
let ShippingService = ShippingService_1 = class ShippingService {
    rateRepo;
    productRepo;
    logger = new common_1.Logger(ShippingService_1.name);
    constructor(rateRepo, productRepo) {
        this.rateRepo = rateRepo;
        this.productRepo = productRepo;
    }
    async onModuleInit() {
        const count = await this.rateRepo.count();
        if (count === 0) {
            await this.rateRepo.save(DEFAULT_RATES.map((r) => this.rateRepo.create(r)));
            this.logger.log('Shipping rates seeded.');
        }
    }
    detectZone(province) {
        const normalized = province.trim().toLowerCase();
        if (normalized === 'ciudad autónoma de buenos aires' || normalized === 'caba') {
            return shipping_zone_enum_1.ShippingZone.CABA;
        }
        if (normalized === 'buenos aires') {
            return shipping_zone_enum_1.ShippingZone.GBA;
        }
        return shipping_zone_enum_1.ShippingZone.INTERIOR;
    }
    async calculateFromWeight(province, totalWeightGrams, deliveryMethod = 'home_delivery') {
        if (deliveryMethod === 'pickup' || deliveryMethod === 'coordinate_by_whatsapp') {
            return {
                shippingMethod: deliveryMethod,
                zone: null,
                totalWeightGrams,
                shippingCost: 0,
                message: null,
            };
        }
        if (totalWeightGrams > 5000) {
            return {
                shippingMethod: 'coordinate_by_whatsapp',
                zone: shipping_zone_enum_1.ShippingZone.A_COORDINAR,
                totalWeightGrams,
                shippingCost: null,
                message: 'El envío se coordina por WhatsApp por superar los 5 kg',
            };
        }
        const zone = this.detectZone(province);
        const rate = await this.rateRepo
            .createQueryBuilder('r')
            .where('r.zone = :zone', { zone })
            .andWhere('r.minWeightGrams <= :w', { w: totalWeightGrams })
            .andWhere('r.maxWeightGrams >= :w', { w: totalWeightGrams })
            .andWhere('r.active = true')
            .getOne();
        return {
            shippingMethod: deliveryMethod,
            zone,
            totalWeightGrams,
            shippingCost: rate ? Number(rate.price) : 0,
            message: null,
        };
    }
    async calculate(dto) {
        const method = dto.deliveryMethod ?? 'home_delivery';
        if (method === 'pickup' || method === 'coordinate_by_whatsapp') {
            return {
                shippingMethod: method,
                zone: null,
                totalWeightGrams: 0,
                shippingCost: 0,
                message: null,
            };
        }
        const products = await this.productRepo.findByIds(dto.items.map((i) => i.productId));
        const totalWeightGrams = dto.items.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            return sum + (product?.weightGrams ?? 0) * item.quantity;
        }, 0);
        return this.calculateFromWeight(dto.province, totalWeightGrams, method);
    }
    async getRates() {
        return this.rateRepo.find({ order: { zone: 'ASC', minWeightGrams: 'ASC' } });
    }
};
exports.ShippingService = ShippingService;
exports.ShippingService = ShippingService = ShippingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shipping_rate_entity_1.ShippingRate)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ShippingService);
//# sourceMappingURL=shipping.service.js.map