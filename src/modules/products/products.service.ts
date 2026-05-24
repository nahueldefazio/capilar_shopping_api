import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateStockDto } from './dto/update-product.dto';
import { slugify } from '../../common/utils/slug.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(query?: {
    saleType?: string;
    categoryId?: number;
    featured?: boolean;
    search?: string;
  }): Promise<Product[]> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.isActive = true');

    if (query?.saleType) qb.andWhere('p.saleType = :saleType', { saleType: query.saleType });
    if (query?.categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query?.featured) qb.andWhere('p.featured = true');
    if (query?.search) qb.andWhere('p.name LIKE :search', { search: `%${query.search}%` });

    return qb.orderBy('p.featured', 'DESC').addOrderBy('p.name', 'ASC').getMany();
  }

  async findFeatured(): Promise<Product[]> {
    return this.productRepo.find({
      where: { isActive: true, featured: true },
      order: { name: 'ASC' },
      take: 8,
    });
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { slug, isActive: true } });
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    return product;
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = dto.slug ?? slugify(dto.name);
    const exists = await this.productRepo.findOne({ where: { slug } });
    if (exists) throw new ConflictException(`Slug "${slug}" already exists`);
    const product = this.productRepo.create({ ...dto, slug });
    return this.productRepo.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    if (dto.name && !dto.slug) dto.slug = slugify(dto.name);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async updateStock(id: number, dto: UpdateStockDto): Promise<Product> {
    const product = await this.findById(id);
    product.stock = dto.stock;
    return this.productRepo.save(product);
  }

  async toggleStatus(id: number): Promise<Product> {
    const product = await this.findById(id);
    product.isActive = !product.isActive;
    return this.productRepo.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findById(id);
    await this.productRepo.remove(product);
  }

  /** Descuenta stock al pagar. Lanza error si no hay suficiente. */
  async decrementStock(id: number, quantity: number): Promise<void> {
    const product = await this.findById(id);
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${quantity}`,
      );
    }
    product.stock -= quantity;
    await this.productRepo.save(product);
  }
}
