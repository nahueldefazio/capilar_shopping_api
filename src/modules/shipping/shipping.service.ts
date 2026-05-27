import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingRate } from './entities/shipping-rate.entity';
import { Product } from '../products/entities/product.entity';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { ShippingZone } from '../../common/enums/shipping-zone.enum';

export interface ShippingCalculationResult {
  shippingMethod: string;
  zone: ShippingZone | null;
  totalWeightGrams: number;
  shippingCost: number | null;
  message: string | null;
}

const DEFAULT_RATES: Array<{
  zone: ShippingZone;
  minWeightGrams: number;
  maxWeightGrams: number;
  price: number;
}> = [
  { zone: ShippingZone.CABA,     minWeightGrams: 0,    maxWeightGrams: 1000,  price: 4000  },
  { zone: ShippingZone.CABA,     minWeightGrams: 1001, maxWeightGrams: 3000,  price: 5500  },
  { zone: ShippingZone.CABA,     minWeightGrams: 3001, maxWeightGrams: 5000,  price: 7000  },
  { zone: ShippingZone.GBA,      minWeightGrams: 0,    maxWeightGrams: 1000,  price: 5000  },
  { zone: ShippingZone.GBA,      minWeightGrams: 1001, maxWeightGrams: 3000,  price: 6500  },
  { zone: ShippingZone.GBA,      minWeightGrams: 3001, maxWeightGrams: 5000,  price: 8000  },
  { zone: ShippingZone.INTERIOR, minWeightGrams: 0,    maxWeightGrams: 1000,  price: 8000  },
  { zone: ShippingZone.INTERIOR, minWeightGrams: 1001, maxWeightGrams: 3000,  price: 10000 },
  { zone: ShippingZone.INTERIOR, minWeightGrams: 3001, maxWeightGrams: 5000,  price: 13000 },
];

@Injectable()
export class ShippingService implements OnModuleInit {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    @InjectRepository(ShippingRate)
    private readonly rateRepo: Repository<ShippingRate>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.rateRepo.count();
    if (count === 0) {
      await this.rateRepo.save(DEFAULT_RATES.map((r) => this.rateRepo.create(r)));
      this.logger.log('Shipping rates seeded.');
    }
  }

  detectZone(province: string): ShippingZone {
    const normalized = province.trim().toLowerCase();
    if (normalized === 'ciudad autónoma de buenos aires' || normalized === 'caba') {
      return ShippingZone.CABA;
    }
    if (normalized === 'buenos aires') {
      return ShippingZone.GBA;
    }
    return ShippingZone.INTERIOR;
  }

  async calculateFromWeight(
    province: string,
    totalWeightGrams: number,
    deliveryMethod = 'home_delivery',
  ): Promise<ShippingCalculationResult> {
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
        zone: ShippingZone.A_COORDINAR,
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

  async calculate(dto: CalculateShippingDto): Promise<ShippingCalculationResult> {
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

  async getRates(): Promise<ShippingRate[]> {
    return this.rateRepo.find({ order: { zone: 'ASC', minWeightGrams: 'ASC' } });
  }
}
