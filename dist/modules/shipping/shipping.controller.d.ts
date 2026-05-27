import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
export declare class ShippingController {
    private readonly shippingService;
    constructor(shippingService: ShippingService);
    calculate(dto: CalculateShippingDto): Promise<import("./shipping.service").ShippingCalculationResult>;
    getRates(): Promise<import("./entities/shipping-rate.entity").ShippingRate[]>;
}
