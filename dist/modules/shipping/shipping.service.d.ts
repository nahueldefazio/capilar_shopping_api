import { OnModuleInit } from '@nestjs/common';
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
export declare class ShippingService implements OnModuleInit {
    private readonly rateRepo;
    private readonly productRepo;
    private readonly logger;
    constructor(rateRepo: Repository<ShippingRate>, productRepo: Repository<Product>);
    onModuleInit(): Promise<void>;
    detectZone(province: string, city?: string): ShippingZone;
    calculateFromWeight(province: string, totalWeightGrams: number, deliveryMethod?: string, city?: string): Promise<ShippingCalculationResult>;
    calculate(dto: CalculateShippingDto): Promise<ShippingCalculationResult>;
    getRates(): Promise<ShippingRate[]>;
}
