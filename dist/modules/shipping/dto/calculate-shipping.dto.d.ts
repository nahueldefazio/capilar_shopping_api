export declare class ShippingItemDto {
    productId: number;
    quantity: number;
}
export declare class CalculateShippingDto {
    province: string;
    city: string;
    postalCode: string;
    items: ShippingItemDto[];
    deliveryMethod?: string;
}
