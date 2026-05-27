import { SaleType } from '../../../common/enums/sale-type.enum';
export declare class CreateProductDto {
    name: string;
    slug?: string;
    description?: string;
    price: number;
    stock: number;
    weightGrams?: number;
    categoryId?: number;
    saleType?: SaleType;
    imageUrl?: string;
    isActive?: boolean;
    featured?: boolean;
}
