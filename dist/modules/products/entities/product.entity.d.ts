import { Category } from '../../categories/entities/category.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { SaleType } from '../../../common/enums/sale-type.enum';
export declare class Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    weightGrams: number;
    imageUrl: string;
    saleType: SaleType;
    isActive: boolean;
    featured: boolean;
    category: Category;
    categoryId: number;
    orderItems: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
