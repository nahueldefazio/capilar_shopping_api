import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateStockDto } from './dto/update-product.dto';
export declare class ProductsService {
    private readonly productRepo;
    constructor(productRepo: Repository<Product>);
    findAll(query?: {
        saleType?: string;
        categoryId?: number;
        featured?: boolean;
        search?: string;
    }): Promise<Product[]>;
    findFeatured(): Promise<Product[]>;
    findBySlug(slug: string): Promise<Product>;
    findById(id: number): Promise<Product>;
    create(dto: CreateProductDto): Promise<Product>;
    update(id: number, dto: UpdateProductDto): Promise<Product>;
    updateStock(id: number, dto: UpdateStockDto): Promise<Product>;
    toggleStatus(id: number): Promise<Product>;
    remove(id: number): Promise<void>;
    decrementStock(id: number, quantity: number): Promise<void>;
}
