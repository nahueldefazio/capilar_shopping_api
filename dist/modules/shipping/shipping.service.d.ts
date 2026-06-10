import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { ShippingZone } from '../../common/enums/shipping-zone.enum';
export interface ShippingCalculationResult {
    shippingMethod: string;
    zone: ShippingZone | null;
    totalWeightGrams: number;
    shippingCost: number | null;
    message: string | null;
}
export declare class ShippingService {
    detectZone(province: string, city?: string): ShippingZone;
    calculateFlat(province: string, city: string, deliveryMethod: string): ShippingCalculationResult;
    calculate(dto: CalculateShippingDto): ShippingCalculationResult;
    getRates(): Array<{
        zone: string;
        method: string;
        price: number;
    }>;
}
