import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateStockDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(saleType?: string, categoryId?: string, featured?: string, search?: string): Promise<import("./entities/product.entity").Product[]>;
    findFeatured(): Promise<import("./entities/product.entity").Product[]>;
    findOne(slug: string): Promise<import("./entities/product.entity").Product>;
    create(dto: CreateProductDto): Promise<import("./entities/product.entity").Product>;
    update(id: number, dto: UpdateProductDto): Promise<import("./entities/product.entity").Product>;
    updateStock(id: number, dto: UpdateStockDto): Promise<import("./entities/product.entity").Product>;
    toggleStatus(id: number): Promise<import("./entities/product.entity").Product>;
    remove(id: number): Promise<void>;
}
