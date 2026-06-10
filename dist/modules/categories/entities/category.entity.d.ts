import { Product } from '../../products/entities/product.entity';
export declare class Category {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
    parent: Category | null;
    parentId: number | null;
    children: Category[];
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
