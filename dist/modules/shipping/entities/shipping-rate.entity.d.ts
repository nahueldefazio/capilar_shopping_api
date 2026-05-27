import { ShippingZone } from '../../../common/enums/shipping-zone.enum';
export declare class ShippingRate {
    id: number;
    zone: ShippingZone;
    minWeightGrams: number;
    maxWeightGrams: number;
    price: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
