import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
export declare class ShippingController {
    private readonly shippingService;
    constructor(shippingService: ShippingService);
    calculate(dto: CalculateShippingDto): import("./shipping.service").ShippingCalculationResult;
    getRates(): {
        zone: string;
        method: string;
        price: number;
    }[];
}
