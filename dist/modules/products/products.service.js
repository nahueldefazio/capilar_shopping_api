"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const slug_util_1 = require("../../common/utils/slug.util");
let ProductsService = class ProductsService {
    productRepo;
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    async findAll(query) {
        const qb = this.productRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.category', 'c')
            .where('p.isActive = true');
        if (query?.saleType)
            qb.andWhere('p.saleType = :saleType', { saleType: query.saleType });
        if (query?.categoryId)
            qb.andWhere('p.categoryId = :categoryId', { categoryId: query.categoryId });
        if (query?.featured)
            qb.andWhere('p.featured = true');
        if (query?.search)
            qb.andWhere('p.name LIKE :search', { search: `%${query.search}%` });
        return qb.orderBy('p.featured', 'DESC').addOrderBy('p.name', 'ASC').getMany();
    }
    async findFeatured() {
        return this.productRepo.find({
            where: { isActive: true, featured: true },
            order: { name: 'ASC' },
            take: 8,
        });
    }
    async findBySlug(slug) {
        const product = await this.productRepo.findOne({ where: { slug, isActive: true } });
        if (!product)
            throw new common_1.NotFoundException(`Product "${slug}" not found`);
        return product;
    }
    async findById(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException(`Product #${id} not found`);
        return product;
    }
    async create(dto) {
        const slug = dto.slug ?? (0, slug_util_1.slugify)(dto.name);
        const exists = await this.productRepo.findOne({ where: { slug } });
        if (exists)
            throw new common_1.ConflictException(`Slug "${slug}" already exists`);
        const product = this.productRepo.create({ ...dto, slug });
        return this.productRepo.save(product);
    }
    async update(id, dto) {
        const product = await this.findById(id);
        if (dto.name && !dto.slug)
            dto.slug = (0, slug_util_1.slugify)(dto.name);
        Object.assign(product, dto);
        return this.productRepo.save(product);
    }
    async updateStock(id, dto) {
        const product = await this.findById(id);
        product.stock = dto.stock;
        return this.productRepo.save(product);
    }
    async toggleStatus(id) {
        const product = await this.findById(id);
        product.isActive = !product.isActive;
        return this.productRepo.save(product);
    }
    async remove(id) {
        const product = await this.findById(id);
        await this.productRepo.remove(product);
    }
    async decrementStock(id, quantity) {
        const product = await this.findById(id);
        if (product.stock < quantity) {
            throw new common_1.BadRequestException(`Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${quantity}`);
        }
        product.stock -= quantity;
        await this.productRepo.save(product);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map