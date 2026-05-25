import { Product } from '../../products/entities/product.entity';
export declare class Category {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
