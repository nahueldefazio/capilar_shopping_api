import { Injectable } from '@nestjs/common';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { ShippingZone } from '../../common/enums/shipping-zone.enum';

export interface ShippingCalculationResult {
  shippingMethod: string;
  zone: ShippingZone | null;
  totalWeightGrams: number;
  shippingCost: number | null;
  message: string | null;
}

// Tarifas planas hardcodeadas por zona y método de entrega
const FLAT_RATES = {
  home_delivery: { CABA_GBA: 11000, INTERIOR: 13000 },
  pickup:        { CABA_GBA:  7000, INTERIOR:  9000 },
} as const;

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

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

@Injectable()
export class ShippingService {
  detectZone(province: string, city = ''): ShippingZone {
    const normalized = normalizeText(province);
    const normalizedCity = normalizeText(city);

    if (normalized === 'ciudad autonoma de buenos aires' || normalized === 'caba') {
      return ShippingZone.CABA;
    }
    if (normalized === 'buenos aires') {
      return GBA_LOCALITIES.has(normalizedCity) ? ShippingZone.GBA : ShippingZone.INTERIOR;
    }
    return ShippingZone.INTERIOR;
  }

  calculateFlat(province: string, city: string, deliveryMethod: string): ShippingCalculationResult {
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
    const rates = FLAT_RATES[deliveryMethod as keyof typeof FLAT_RATES];

    if (!rates) {
      return {
        shippingMethod: deliveryMethod,
        zone,
        totalWeightGrams: 0,
        shippingCost: 0,
        message: null,
      };
    }

    const isCabaOrGba = zone === ShippingZone.CABA || zone === ShippingZone.GBA;
    const shippingCost = isCabaOrGba ? rates.CABA_GBA : rates.INTERIOR;

    return {
      shippingMethod: deliveryMethod,
      zone,
      totalWeightGrams: 0,
      shippingCost,
      message: null,
    };
  }

  calculate(dto: CalculateShippingDto): ShippingCalculationResult {
    return this.calculateFlat(dto.province, dto.city ?? '', dto.deliveryMethod ?? 'home_delivery');
  }

  getRates(): Array<{ zone: string; method: string; price: number }> {
    return [
      { zone: 'CABA/GBA', method: 'home_delivery', price: FLAT_RATES.home_delivery.CABA_GBA },
      { zone: 'CABA/GBA', method: 'pickup',        price: FLAT_RATES.pickup.CABA_GBA },
      { zone: 'Interior', method: 'home_delivery', price: FLAT_RATES.home_delivery.INTERIOR },
      { zone: 'Interior', method: 'pickup',        price: FLAT_RATES.pickup.INTERIOR },
    ];
  }
}
