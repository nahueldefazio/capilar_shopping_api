"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingService = void 0;
const common_1 = require("@nestjs/common");
const shipping_zone_enum_1 = require("../../common/enums/shipping-zone.enum");
const FLAT_RATES = {
    home_delivery: { CABA_GBA: 11000, INTERIOR: 13000 },
    pickup: { CABA_GBA: 7000, INTERIOR: 9000 },
};
const GBA_LOCALITIES = new Set([
    'almirante brown',
    'adrogue',
    'burzaco',
    'claypole',
    'longchamps',
    'avellaneda',
    'dock sud',
    'gerli',
    'sarandi',
    'wilde',
    'berazategui',
    'esteban echeverria',
    'monte grande',
    'luis guillon',
    'ezeiza',
    'canning',
    'florencio varela',
    'general san martin',
    'san martin',
    'villa ballester',
    'hurlingham',
    'ituzaingo',
    'jose c paz',
    'la matanza',
    'ciudad evita',
    'gregorio de laferrere',
    'laferrere',
    'ramos mejia',
    'san justo',
    'lanus',
    'remedios de escalada',
    'valentin alsina',
    'lomas de zamora',
    'banfield',
    'temperley',
    'malvinas argentinas',
    'grand bourg',
    'merlo',
    'moreno',
    'moron',
    'castelar',
    'haedo',
    'quilmes',
    'bernal',
    'ezpeleta',
    'san fernando',
    'victoria',
    'san isidro',
    'beccar',
    'boulogne',
    'martinez',
    'san miguel',
    'bella vista',
    'tigre',
    'tres de febrero',
    'caseros',
    'santos lugares',
    'vicente lopez',
    'florida',
    'munro',
    'olivos',
]);
function normalizeText(value) {
    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}
let ShippingService = class ShippingService {
    detectZone(province, city = '') {
        const normalized = normalizeText(province);
        const normalizedCity = normalizeText(city);
        if (normalized === 'ciudad autonoma de buenos aires' || normalized === 'caba') {
            return shipping_zone_enum_1.ShippingZone.CABA;
        }
        if (normalized === 'buenos aires') {
            return GBA_LOCALITIES.has(normalizedCity) ? shipping_zone_enum_1.ShippingZone.GBA : shipping_zone_enum_1.ShippingZone.INTERIOR;
        }
        return shipping_zone_enum_1.ShippingZone.INTERIOR;
    }
    calculateFlat(province, city, deliveryMethod) {
        if (deliveryMethod === 'coordinate_by_whatsapp') {
            return {
                shippingMethod: deliveryMethod,
                zone: null,
                totalWeightGrams: 0,
                shippingCost: 0,
                message: null,
            };
        }
        const zone = this.detectZone(province, city);
        const rates = FLAT_RATES[deliveryMethod];
        if (!rates) {
            return {
                shippingMethod: deliveryMethod,
                zone,
                totalWeightGrams: 0,
                shippingCost: 0,
                message: null,
            };
        }
        const isCabaOrGba = zone === shipping_zone_enum_1.ShippingZone.CABA || zone === shipping_zone_enum_1.ShippingZone.GBA;
        const shippingCost = isCabaOrGba ? rates.CABA_GBA : rates.INTERIOR;
        return {
            shippingMethod: deliveryMethod,
            zone,
            totalWeightGrams: 0,
            shippingCost,
            message: null,
        };
    }
    calculate(dto) {
        return this.calculateFlat(dto.province, dto.city ?? '', dto.deliveryMethod ?? 'home_delivery');
    }
    getRates() {
        return [
            { zone: 'CABA/GBA', method: 'home_delivery', price: FLAT_RATES.home_delivery.CABA_GBA },
            { zone: 'CABA/GBA', method: 'pickup', price: FLAT_RATES.pickup.CABA_GBA },
            { zone: 'Interior', method: 'home_delivery', price: FLAT_RATES.home_delivery.INTERIOR },
            { zone: 'Interior', method: 'pickup', price: FLAT_RATES.pickup.INTERIOR },
        ];
    }
};
exports.ShippingService = ShippingService;
exports.ShippingService = ShippingService = __decorate([
    (0, common_1.Injectable)()
], ShippingService);
//# sourceMappingURL=shipping.service.js.map